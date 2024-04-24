const express = require('express')
const fs = require('fs')
const http = require('http');
const https = require('https')
require('dotenv').config()
const cors = require('cors')
const sharp = require("sharp")
const { startSocket } = require('./sockets')
const { startAmqpMessenger, getGlobalAmqpSender, teamspeakAuthRequest } = require('./amqpmessenger')
const { checkEmailOrUsernameExists, createUserAccount, createUserSessionFromPassword, getInitialData, getUserProfileData, validateSessionGetUserid, getFriends, getLatestShoutboxMessages, getOnlineUsersList, getRoomFromJoincode, addUserToRoom, createRoom, checkIfUserHasAccessToRoom, getRoomInfo, getRoomMembers, createInviteCode, submitShoutboxMessage, getMinimalUserInfo, checkIfFriendrequestExists, getFriendRequests, updateLastPicureChainge, addFriendRequest, deleteFriendRequest, acceptFriendRequest } = require('./db');
const { minioClient } = require('./minio');
const app = express()

const nopicture = fs.readFileSync("nopicture.webp")

const FRONTEND_URL = process.env.PUBLIC_FRONTEND_URL
const BACKEND_URL = process.env.PUBLIC_BACKEND_URL

let corsConfig = {
    origin: process.env.PUBLIC_FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
}
app.use(cors(corsConfig))

app.use(express.json({ limit: "21mb" }));

if (process.env.PROXY) {
    app.set('trust proxy', true)
}

const server = http.createServer(app);

const port = process.env.PORT
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

var subscriptions = {
    "shoutbox": []
}

startSocket(server, corsConfig, subscriptions)
startAmqpMessenger(subscriptions)

app.post('/createaccount', async (req, res) => {
    let body = req.body
    let userexists = await checkEmailOrUsernameExists(body.username, body.email)
    if (userexists) {
        res.send({ error: true, message: `A user with the same ${userexists == 1 ? "username" : "email"} already exists` })
        return
    }
    res.send(await createUserAccount(body.email, body.username, body.password, req))
})

app.post('/createsession', async (req, res) => {
    let body = req.body
    res.send(await createUserSessionFromPassword(body.usernameoremail, body.password, req))
})

app.post('/getInitialData', async (req, res) => {
    let body = req.body
    res.send(await getInitialData(body))
})

app.post('/getProfilePageData', async (req, res) => {
    let userid = req.body.userid
    const loggedInUserId = await validateSessionGetUserid(req.body, true)
    let loggedInUserInfo = {}
    if (loggedInUserId) {
        const friendshipData = await checkIfFriendrequestExists(loggedInUserId, userid)
        loggedInUserInfo.friendRequestSent = friendshipData ? true : false
        if (friendshipData) {
            loggedInUserInfo.receivedRequest = friendshipData.requester == userid
            loggedInUserInfo.requestAccepted = friendshipData.accepted
        }
    }
    res.send(await getUserProfileData(userid, loggedInUserInfo))
})

app.post('/getIndexPageData', async (req, res) => {
    let loggedInData = {}
    if (req.body.session) {
        const userid = await validateSessionGetUserid(req.body, true)
        loggedInData.onlineFriends = await getFriends(userid, true)
    }
    res.send({
        shoutbox: await getLatestShoutboxMessages(),
        onlineusers: await getOnlineUsersList(),
        ...loggedInData
    })
})

app.get('/getUserImage/:userid', async (req, res) => {
    minioClient.getObject("profilepictures", req.params.userid + "_profilepicture.webp", (err, result) => {
        res.setHeader("content-type", "image/webp")
        if (err) {
            res.send(nopicture)
            return
        }
        result.on("data", (chunk) => {
            res.write(chunk)
        })
        result.on("end", () => {
            res.end()
        })
    })
})

app.post('/joinRoom', async (req, res) => {
    try {
        let body = req.body
        if (!body.session) {
            res.send({ error: 1 })
            return
        }
        let userid = await validateSessionGetUserid(body, true)
        if (!userid) {
            res.send({ error: 1 })
            return
        }
        let roomid = await getRoomFromJoincode(body.joincode)
        await addUserToRoom(userid, roomid, false, false)
        res.send({ error: false, roomid })
    } catch (e) {
        res.send({ error: true, message: "There was an error" })
    }
})

app.post('/createRoom', async (req, res) => {
    const userid = await validateSessionGetUserid(req.body, true)
    const roomName = req.body.name
    if (roomName.length < 3) {
        res.send({ error: true, message: "Too short room name" })
        return
    }
    res.send(await createRoom(userid, roomName, req.body.public, req.body.chat))
})

app.post('/getRoomData/:roomid', async (req, res) => {
    let userid = await validateSessionGetUserid(req.body, true)
    let roomid = req.params.roomid
    if (await checkIfUserHasAccessToRoom(userid, roomid)) {
        res.send({
            ... await getRoomInfo(roomid),
            users: await getRoomMembers(roomid),
            invitecode: FRONTEND_URL + "/join/" + await createInviteCode(roomid, userid)
        })
    } else {
        res.send({ error: true, message: "You don't have access to this room" })
    }
})

app.post('/submitShoutboxMessage', async (req, res) => {
    let body = req.body
    let userid = await validateSessionGetUserid(body, true)
    if (!userid) {
        res.send({ error: true, message: "Login failed" })
        return
    }
    if (body.message.length > 256) {
        res.send({ error: true, message: "Message too long (max 256 characters)" })
        return;
    }
    res.send(await submitShoutboxMessage(userid, body.message))
    getGlobalAmqpSender().publish("shoutboxexchange", '', Buffer.from(JSON.stringify({
        author: await getMinimalUserInfo(userid),
        timestamp: Math.round(Date.now() / 1000),
        message: body.message
    })))
})

app.post('/getFriendPageData', async (req, res) => {
    try {
        let userid = await validateSessionGetUserid(req.body, true)
        res.send({
            friendrequests: await getFriendRequests(userid),
            friends: await getFriends(userid, false)
        })
    } catch (e) {
        res.send(e)
    }
})

app.post('/updateProfilePicture', async (req, res) => {
    const userid = await validateSessionGetUserid(req.body, true)
    try {
        const imageBase64 = req.body.image.split(",")[1]
        const imageBuffer = Buffer.from(imageBase64, "base64")
        const resultImage = await sharp(imageBuffer)
            .resize(512, 512)
            .toBuffer()
        await minioClient.putObject("profilepictures", userid + "_profilepicture.webp", resultImage)
        updateLastPicureChainge(userid)
        res.send({ error: false })
    } catch (e) {
        res.send({ error: true, message: "Error while processing picture" })
    }

})

app.post('/sendFriendRequest', async (req, res) => {
    const requester = await validateSessionGetUserid(req.body, true)
    const targetUser = req.body.target
    if (requester == targetUser) {
        return
    }
    if (await checkIfFriendrequestExists(requester, targetUser)) {
        res.send({ error: true, message: "You already send this user a friend-request" })
        return
    }
    res.send(await addFriendRequest(requester, targetUser))
})

app.post('/deleteFriendship', async (req, res) => {
    const requester = await validateSessionGetUserid(req.body, true)
    const targetUser = req.body.target
    if (requester == targetUser) {
        return
    }
    res.send(await deleteFriendRequest(requester, targetUser))
})

app.post('/acceptFriendRequest', async (req, res) => {
    const userid = await validateSessionGetUserid(req.body, true)
    const requester = req.body.requester
    const friendRequestData = await checkIfFriendrequestExists(requester, userid)
    if (friendRequestData.target != userid) {
        return
    }
    res.send(await acceptFriendRequest(friendRequestData))
})

app.get('/requestTeamspeakAuthUsers', async (req, res) => {
    let ip = req.ip
    if (process.env.OVERRIDEIP) {
        ip = process.env.OVERRIDEIP
    }
    await teamspeakAuthRequest({
        type: "getclientsforip",
        ip
    }, (response) => {
        res.send(response)
        return true
    })
})
process.on('uncaughtException', function (error) {
    console.log(error.stack);
});