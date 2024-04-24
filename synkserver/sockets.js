const { Server } = require("socket.io");
const { validateSessionGetUserid, updateUserOnlineState, checkIfMemberIsUserOfRoom, getRoomUserInfo, getMinimalUserInfo, setVideoPlayingProgress, logRoomChatMessage, setRoomVideoSrc, loginOrCreateAccountGetSessionFromTeamspeak, addMovieProxyMapping } = require("./db");
const { getGlobalAmqpSender, roomsubscriptions, joinRoomExchange, teamspeakAuthRequest } = require('./amqpmessenger')

async function broadcastRoomMessage(roomid, message) {
    getGlobalAmqpSender().publish("room_" + roomid, '', Buffer.from(JSON.stringify(message)))
}

function startSocket(server, corsConfig, subscriptions) {
    const io = new Server(server, {
        cors: corsConfig
    });

    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on("requestTeamspeakAuth", async (info) => {
            const code = makeid(6)
            let ip = socket.handshake.address
            if (process.env.PROXY) {
                console.log(socket.handshake.headers)
                ip = socket.handshake.headers["x-forwarded-for"]
            }
            if (process.env.OVERRIDEIP) {
                ip = process.env.OVERRIDEIP
            }
            await teamspeakAuthRequest({
                type: "sendverificationcode",
                clientid: info.id,
                ip,
                verificationcode: code
            }, async (message) => {
                let json = JSON.parse(message)
                console.log(json)
                if (json.progress == 1) {
                    console.log("YES")
                    let session = await loginOrCreateAccountGetSessionFromTeamspeak(json.username, json.identity, socket.handshake.headers["user-agent"], ip)
                    socket.emit("teamspeakSessionResponse", session)
                    return true
                }
                console.log("returning false")
                return false
            })
            socket.emit("teamspeakCode", code)
        })
        socket.on("auth", async (authdata) => {
            let id = await validateSessionGetUserid(authdata, false)
            await updateUserOnlineState(id, true, true)
            socket.authuserid = id
            socket.emit("authsuccess")
            console.log("socket connected with userid " + id)
        })
        socket.on('subscribe', (data) => {
            console.log("subscribe: " + data)
            subscriptions[data].push(socket)
        })
        socket.on('unsubscribe', (data) => {
            console.log("unsubscribe: " + data)
            const index = subscriptions[data].indexOf(socket);
            if (index !== -1) {
                subscriptions[data].splice(index, 1);
            }
        })
        socket.on('joinroom', async (roomid) => {
            if (!socket.authuserid) {
                return
            }
            if (!await checkIfMemberIsUserOfRoom(socket.authuserid, roomid)) {
                return
            }
            if (roomsubscriptions[roomid]) {
                roomsubscriptions[roomid].push(socket)
            } else {
                //here, this instance joins the global room exchange for this requested room
                roomsubscriptions[roomid] = [socket]
                await joinRoomExchange(roomid)
            }
            broadcastRoomMessage(roomid, {
                type: "newuser",
                user: {
                    isadmin: (await getRoomUserInfo(socket.authuserid, roomid)).admin,
                    user: await getMinimalUserInfo(socket.authuserid)
                }
            })
            socket.roomid = roomid
            //todo: set user to connected in db and to disconnected on socket disconnect
        })
        socket.on('roomchatmessage', async (chatmessage) => {
            if (!socket.authuserid || !socket.roomid) {
                return
            }
            let minimaluser = await getMinimalUserInfo(socket.authuserid)
            logRoomChatMessage(socket.roomid, socket.authuserid, chatmessage)
            getGlobalAmqpSender().publish("room_" + socket.roomid, '', Buffer.from(JSON.stringify({
                type: "chat",
                message: { author: minimaluser, timestamp: Math.round(Date.now() / 1000), message: chatmessage }
            })))
        })
        socket.on('playvideo', async (playing, videotime) => {
            if (!socket.authuserid || !socket.roomid) {
                return
            }
            videotime = Math.round(videotime * 1000)
            const time = Date.now()
            setVideoPlayingProgress(socket.roomid, playing, videotime, time)
            getGlobalAmqpSender().publish("room_" + socket.roomid, '', Buffer.from(JSON.stringify({
                type: "video_play",
                playing: playing,
                progress: videotime,
                progressTime: time
            })))
        })
        socket.on('changeurl', async (newUrl) => {
            if (!socket.authuserid || !socket.roomid) {
                return
            }
            await setRoomVideoSrc(socket.roomid, newUrl)
            broadcastRoomMessage(socket.roomid, {
                type: "newurl",
                url: newUrl
            })
        })
        socket.on('roommessage', async (message) => {
            getGlobalAmqpSender().publish("room_" + socket.roomid, '', Buffer.from(message))
        })
        socket.on('disconnect', async () => {
            if (!socket.authuserid) {
                return
            }
            let id = socket.authuserid
            await updateUserOnlineState(id, true, false)
            console.log("user with id " + id + "disconnected")
            if (socket.roomid) {
                broadcastRoomMessage(socket.roomid, { type: "removeuser", id })
            }

            console.log('user disconnected');
        });
        socket.on("pingtime", (callback) => {
            callback(Date.now());
        });
    });
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

module.exports = { startSocket }