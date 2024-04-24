const { Pool } = require('pg')

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL

const crypto = require('crypto');

const pool = new Pool({
    user: 'root',
    host: process.env.DATABASE_URL,
    database: 'synk2',
    password: 'root',
    port: 5432,
})

pool.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(64) UNIQUE, email VARCHAR(128) UNIQUE, password VARCHAR(64), salt VARCHAR(64), lastOnline BIGINT, created BIGINT, socketConnected BOOL, lastPictureChange BIGINT, teamspeakid VARCHAR(28), googleid VARCHAR(128));', () => {
    pool.query('CREATE TABLE IF NOT EXISTS sessions (userid INTEGER REFERENCES users(id), creation BIGINT, expiry BIGINT, sessionid VARCHAR(64) UNIQUE PRIMARY KEY, deviceid VARCHAR(512), firstip VARCHAR(64), lastip VARCHAR(64), sessionsecret VARCHAR(64));')
    pool.query('CREATE TABLE IF NOT EXISTS shoutboxmessages (uid SERIAL PRIMARY KEY, userid INTEGER REFERENCES users(id), creation BIGINT, message VARCHAR(256))')
    pool.query('CREATE TABLE IF NOT EXISTS friends(ID SERiAL PRIMARY KEY, requester INTEGER REFERENCES users(id), target INTEGER REFERENCES users(id), accepted BOOL, created_time BIGINT, accepted_time BIGINT)')
    pool.query('CREATE TABLE IF NOT EXISTS rooms(id SERIAL PRIMARY KEY, roomName VARCHAR(32), creation BIGINT, current_url VARCHAR(512), current_video_playing BOOL, current_video_progress BIGINT, current_video_progress_time BIGINT, adminControlsOnly BOOL, public BOOL, chatEnabled BOOL, waitForBuffering BOOL)', () => {
        pool.query('CREATE TABLE IF NOT EXISTS roomMembers(userid INTEGER REFERENCES users(id), roomid INTEGER REFERENCES rooms(id), admin BOOL, connected BOOL)')
        pool.query('CREATE TABLE IF NOT EXISTS roomChatMessages(uid SERIAL PRIMARY KEY, roomid INTEGER REFERENCES rooms(id), userid INTEGER REFERENCES users(id), creation BIGINT, message VARCHAR(256))')
        pool.query('CREATE TABLE IF NOT EXISTS roomInvites(roomid INTEGER REFERENCES rooms(id), inviteCode VARCHAR(8), creator INTEGER REFERENCES users (id), creation BIGINT, UNIQUE(inviteCode))')
    })
})

function checkEmailOrUsernameExists(username, email) {
    return new Promise((resolve) => {
        pool.query("SELECT email, username FROM users WHERE username = $1 OR email = $2", [username, email], (err, result) => {
            if (result.rows.length > 0) {
                let row = result.rows[0]
                console.log(row)
                if (row.username == username) {
                    resolve(1)
                }
                if (row.email == email) {
                    resolve(2)
                }
            } else {
                resolve(false)
            }
        })
    })
}

function createUserAccount(email, username, password, req) {
    return new Promise((resolve) => {
        let saltbytes = crypto.randomBytes(32)
        let salt = saltbytes.toString('hex');
        let passwordhash = crypto.createHash('sha256').update(password + salt).digest("hex")
        pool.query("INSERT INTO users (username, email, password, salt, created) VALUES ($1, $2, $3, $4, $5) RETURNING id", [username, email, passwordhash, salt, Math.round(Date.now() / 1000)], async (err, result) => {
            if (err) {
                return resolve({ error: true, message: "An unknown error occurred. (0x1)" })
            }
            let userid = result.rows[0].id
            try {
                let response = await createSession(userid, req.headers["user-agent"], req.ip)
                resolve(response)
            } catch (e) {
                console.log(e)
                resolve({ error: true, message: "An unknown error occurred. (0x2)" })
            }
        })
    })
}

function createSession(userid, deviceinfo, ipaddr) {
    return new Promise((resolve, reject) => {
        let sessionid = crypto.randomBytes(32).toString("hex")
        let sessionsecret = crypto.randomBytes(32).toString("hex")
        let now = Math.round(Date.now() / 1000)
        pool.query("INSERT INTO sessions (userid, creation, expiry, sessionid, deviceid, firstip, sessionsecret) VALUES " +
            "($1, $2, $3, $4, $5, $6, $7)", [userid, now, now + 60 * 60 * 24 * 2, sessionid, deviceinfo, ipaddr, sessionsecret], (err) => {
                if (err) {
                    console.log(err)
                    reject()
                }
                resolve({ error: false, sessionid, sessionsecret })
            })
    })
}

function createUserSessionFromPassword(usernameoremail, password, req) {
    return new Promise((resolve) => {
        pool.query("SELECT * FROM users WHERE username ILIKE $1 OR email ILIKE $1", [usernameoremail], async (err, result) => {
            if (err || result.rowCount == 0) {
                resolve({ error: true, message: "An unknown error occurred. (1x1)" })
                return
            }
            let passwordhash = crypto.createHash('sha256').update(password + result.rows[0].salt).digest("hex")
            if (passwordhash != result.rows[0].password) {
                resolve({ error: true, message: "Invalid Password" })
                return;
            }
            let response = await createSession(result.rows[0].id, req.headers["user-agent"], req.ip)
            resolve(response)
        })
    })
}

function getInitialData(body) {
    return new Promise((resolve) => {
        pool.query("SELECT * FROM sessions JOIN users ON users.id = sessions.userid WHERE sessionid = $1 AND sessionsecret = $2", [body.session, body.sessionsecret], async (err, result) => {
            if (err || result.rowCount == 0) {
                resolve({ error: true, message: "An unknown error occurred. (1x1)" })
                return
            }
            const userid = result.rows[0].userid
            resolve({
                userid: userid,
                username: result.rows[0].username,
                friendrequests: await getFriendRequests(userid),
                image: BACKEND_URL + "/getUserImage/" + userid + "?" + result.rows[0].lastpicturechange
            })
        })
    })
}

function getUserProfileData(userid, loggedInUserInfo) {
    return new Promise((resolve) => {
        pool.query("SELECT username, lastonline, created, lastpicturechange from users WHERE id = $1", [userid], async (err, result) => {
            if (err || result.rowCount == 0) {
                resolve({ error: true, message: "An unknown error occurred. (1x5)" })
                return
            }
            const row = result.rows[0]
            let online = true
            if (Number(row.lastonline) < Math.round(Date.now() / 1000) - 10 * 60) {
                online = false
            }
            resolve({
                username: row.username,
                online,
                joined: Number(row.created),
                image: BACKEND_URL + "/getUserImage/" + userid + "?" + row.lastpicturechange,
                ...loggedInUserInfo
            })
        })
    })
}

function updateUserOnlineState(userid, changeSocketConnectionState, socketConnectionState) {
    return new Promise((resolve, reject) => {
        let args = [Math.round(Date.now() / 1000), userid]
        if (changeSocketConnectionState) {
            args = [Math.round(Date.now() / 1000), socketConnectionState, userid]
        }
        let query = `UPDATE users SET lastOnline = $1${changeSocketConnectionState ? ", socketConnected = $2" : ''} WHERE id = $${changeSocketConnectionState ? "3" : "2"}`
        pool.query(query, args, (err, result) => {
            if (err) {
                reject(err.message)
                return
            }
            resolve()
        })
    })
}

function validateSessionGetUserid(body, updateOnlineState) {
    return new Promise((resolve) => {
        pool.query("SELECT * FROM sessions WHERE sessionid = $1 AND sessionsecret = $2", [body.session, body.sessionsecret], (err, result) => {
            if (result.rowCount == 0) {
                resolve(false)
            } else {
                let id = result.rows[0].userid
                resolve(id)
                if (updateOnlineState) {
                    updateUserOnlineState(id, false, null)
                }
            }
        })
    })
}

function getFriends(userid, onlyonline) {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT users.id as id, username as name, EXTRACT(EPOCH FROM NOW()) - users.lastonline <= 600 AS online, lastpicturechange from friends JOIN users ON ($1 = friends.target OR $1 = friends.requester) WHERE (target = $1 OR requester = $1) AND accepted = true AND users.id != $1 ${onlyonline ? "AND ((EXTRACT(EPOCH FROM NOW()) - users.lastonline) <= 600 OR users.socketconnected)" : ""} ORDER BY created_time DESC`, [userid], (err, result) => {
            if (err) {
                reject({ error: true, message: "An unknown error occurred. (1x15)" })
                return
            }
            let response = []
            for (let i = 0; i < result.rows.length; i++) {
                let row = result.rows[i]
                response.push({
                    user: {
                        id: row.id,
                        name: row.name,
                        image: BACKEND_URL + "/getUserImage/" + row.id + "?" + row.lastpicturechange
                    },
                    status: row.online,
                })
            }
            resolve(response)
        })
    })
}

function getLatestShoutboxMessages() {
    return new Promise((resolve, reject) => {
        pool.query("SELECT shoutboxmessages.*, users.id, users.username, users.lastpicturechange FROM shoutboxmessages JOIN users on shoutboxmessages.userid = users.id ORDER BY uid DESC LIMIT 20", (err, result) => {
            if (err) {
                reject()
                return
            }
            let messages = result.rows
            let response = []
            for (let i = messages.length - 1; i >= 0; i--) {
                let message = messages[i]
                response.push({
                    author: {
                        id: message.userid,
                        image: BACKEND_URL + "/getUserImage/" + message.userid + "?" + message.lastpicturechange,
                        name: message.username
                    },
                    timestamp: message.creation,
                    message: message.message
                })
            }
            resolve(response)
        })
    })
}

function getOnlineUsersList() {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id, username as name, lastpicturechange FROM users WHERE socketconnected = true OR lastonline > $1", [Math.round(Date.now() / 1000) - 60 * 10], (err, result) => {
            if (err) {
                reject(err.message)
                return
            }
            let response = []
            for (let i = 0; i < result.rows.length; i++) {
                let row = result.rows[i]
                response.push({
                    image: BACKEND_URL + "/getUserImage/" + row.id + "?" + row.lastpicturechange,
                    id: row.id,
                    name: row.name,
                })
            }
            resolve(response)
        })
    })
}

function getFriendRequests(userid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT requester, friends.id, created_time, username as name, EXTRACT(EPOCH FROM NOW()) - users.lastonline <= 600 AS online, lastpicturechange from friends JOIN users ON users.id = friends.requester WHERE target = $1 AND accepted = false ORDER BY created_time DESC", [userid], (err, result) => {
            if (err) {
                reject({ error: true, message: "An unknown error occurred. (1x11)" })
                return
            }
            let response = []
            for (let i = 0; i < result.rows.length; i++) {
                let row = result.rows[i]
                response.push({
                    requester: {
                        user: {
                            id: row.requester,
                            name: row.name,
                            image: BACKEND_URL + "/getUserImage/" + row.requester + "?" + row.lastpicturechange
                        },
                        status: row.online,
                    },
                    id: row.id,
                    created_time: row.created_time
                })
            }
            resolve(response)
        })
    })
}

function getRoomFromJoincode(joincode) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM roominvites WHERE invitecode = $1", [joincode], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result.rows[0].roomid)
        })
    })
}

function isUserInRoom(userid, roomid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM roommembers WHERE userid = $1 AND roomid = $2", [userid, roomid], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result.rowCount > 0)
        })
    })
}

function addUserToRoom(userid, roomid, isadmin, connected) {
    return new Promise(async (resolve, reject) => {
        if (await isUserInRoom(userid, roomid)) {
            return resolve()
        }
        pool.query("INSERT INTO roommembers (userid, roomid, admin, connected) VALUES ($1, $2, $3, $4)", [userid, roomid, isadmin, connected], async (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}

function createRoom(userid, roomname, ispublic, haschat) {
    return new Promise((resolve) => {
        pool.query("INSERT INTO rooms (roomname, creation, public, chatenabled, adminControlsOnly, waitForBuffering, current_url) VALUES ($1, $2, $3, $4, true, true, 'https://www.w3schools.com/html/mov_bbb.mp4') RETURNING id",
            [roomname, Math.round(Date.now() / 1000), ispublic, haschat],
            async (err, result) => {
                if (err) {
                    return resolve({ error: true, message: "Unknown Error (7x22)" })
                }
                const roomid = result.rows[0].id
                await addUserToRoom(userid, roomid, true, false)
                resolve({ error: false, roomid })
            })
    })
}

function checkIfUserHasAccessToRoom(userid, roomid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM rooms LEFT JOIN roommembers ON rooms.id = roommembers.roomid AND roommembers.userid = $1 WHERE rooms.id = $2", [userid, roomid], (err, result) => {
            if (err || result.rowCount == 0) {
                return reject(err)
            }
            const row = result.rows[0]
            if (row.public) {
                return resolve(true)
            }
            resolve(row.userid != null)
        })
    })
}

function getRoomInfo(roomid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM rooms WHERE id = $1", [roomid], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result.rows[0])
        })
    })
}

function getRoomMembers(roomid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT userid, lastpicturechange, username, admin FROM roommembers as A JOIN users AS B ON A.userid = B.id WHERE roomid = $1", [roomid], (err, result) => {
            if (err) {
                return reject(err)
            }
            let response = result.rows.map((row) => {
                return {
                    isadmin: row.admin,
                    user: {
                        id: row.userid,
                        image: BACKEND_URL + "/getUserImage/" + row.userid + "?" + row.lastpicturechange,
                        name: row.username
                    }
                }
            })
            resolve(response)
        })
    })
}

function createInviteCode(roomid, creator) {
    return new Promise((resolve, reject) => {
        const code = crypto.randomBytes(4).toString("hex")
        pool.query("INSERT INTO roominvites(roomid, invitecode, creator, creation) VALUES ($1, $2, $3, $4)", [roomid, code, creator, Math.round(Date.now() / 1000)], (err) => {
            if (err) {
                return reject(err)
            }
            resolve(code)
        })
    })
}

function getMinimalUserInfo(userid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM users WHERE id = $1", [userid], (err, result) => {
            if (err || result.rowCount == 0) {
                reject()
            } else {
                let row = result.rows[0]
                resolve({
                    id: row.id,
                    image: BACKEND_URL + "/getUserImage/" + row.id + "?" + row.lastpicturechange,
                    name: row.username
                })
            }
        })
    })
}

function submitShoutboxMessage(userid, message) {
    return new Promise((resolve) => {
        pool.query("INSERT INTO shoutboxmessages (userid, creation, message) VALUES ($1, $2, $3)", [userid, Math.round(Date.now() / 1000), message], async (err, result) => {
            if (err) {
                resolve({ error: true, message: "unknown error" })
                return
            }
            resolve({ error: false })
        })
    })
}

function checkIfFriendrequestExists(requester, target) {
    return new Promise((resolve) => {
        pool.query("SELECT * FROM friends WHERE (requester = $2 AND target = $1) OR (requester = $1 AND target = $2)", [requester, target], (err, result) => {
            if (err) {//todo error handling
                console.error(err)
                resolve(false)
                return
            }
            resolve(result.rowCount > 0 ? result.rows[0] : false)
        })
    })
}

function checkIfMemberIsUserOfRoom(userid, roomid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM roommembers WHERE roomid = $1 AND userid = $2", [roomid, userid], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result.rowCount > 0)
        })
    })
}

async function getRoomUserInfo(userid, roomid) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM roommembers WHERE roomid = $1 AND userid = $2", [roomid, userid], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result.rows[0])
        })
    })
}

async function setVideoPlayingProgress(roomid, playing, progress, progresstime) {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE rooms SET current_video_playing = $1, current_video_progress = $2, current_video_progress_time = $3 WHERE id = $4", [playing, progress, progresstime, roomid], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}

function logRoomChatMessage(roomid, userid, message) {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO roomchatmessages (roomid, userid, creation, message) VALUES ($1, $2, $3, $4)", [roomid, userid, Math.round(Date.now() / 1000), message], (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}

async function setRoomVideoSrc(roomid, src) {
    return new Promise((resolve, reject) => {
        pool.query("UPDATE rooms SET current_url = $1 WHERE id = $2", [src, roomid], (err) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}

function updateLastPicureChainge(userid) {
    pool.query("UPDATE users SET lastpicturechange = $1 WHERE id = $2", [Math.round(Date.now() / 1000), userid])
}

function addFriendRequest(requester, targetUser) {
    return new Promise((resolve) => {
        pool.query("INSERT INTO friends(requester, target, created_time, accepted) VALUES ($1, $2, $3, false)", [requester, targetUser, Math.round(Date.now() / 1000)], (err, result) => {
            if (err) {
                resolve({ error: true, message: "Unknown Error (1x92)" })
                return
            }
            resolve({ error: false })
        })
    })
}

function deleteFriendRequest(requester, targetUser) {
    return new Promise((resolve) => {
        pool.query("DELETE FROM friends WHERE (requester = $1 AND target = $2) OR (requester = $2 AND target = $1)", [requester, targetUser], (err, result) => {
            if (err) {
                resolve({ error: true, message: "Unknown Error (1x93)" })
                return
            }
            resolve({ error: false })
        })
    })
}

function acceptFriendRequest(friendRequestData) {
    return new Promise((resolve) => {
        pool.query("UPDATE friends SET accepted = true, accepted_time = $1 WHERE id = $2", [Math.round(Date.now() / 1000), friendRequestData.id], (err, result) => {
            if (err) {
                resolve({ error: true, message: "Unknown Error (1x50)" })
                return
            }
            resolve({ error: false })
        })
    })
}

function loginOrCreateAccountGetSessionFromTeamspeak(username, identity, deviceinfo, ip) {
    return new Promise(async (resolve, reject) => {
        let existinguser = await checkIfTeamspeakIdentityIsRegistered(identity)
        if (!existinguser) {
            await new Promise((resolve1) => {
                pool.query("INSERT INTO users (username, created, socketconnected, teamspeakid) VALUES ($1, $2, $3, $4) RETURNING id", [username, Math.round(Date.now() / 1000), false, identity], (err, result1) => {
                    if (err) {
                        return reject(err)
                    }
                    existinguser = result1.rows[0].id
                    resolve1()
                })
            })
        }
        resolve(await createSession(existinguser, deviceinfo, ip))
    })
}

function checkIfTeamspeakIdentityIsRegistered(identity) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM users WHERE teamspeakid = $1", [identity], (err, result) => {
            if (err) {
                return reject(err)
            }
            if (result.rowCount > 0) {
                resolve(result.rows[0].id)
            } else {
                resolve(false)
            }
        })
    })
}

module.exports = { loginOrCreateAccountGetSessionFromTeamspeak, acceptFriendRequest, deleteFriendRequest, addFriendRequest, updateLastPicureChainge, setRoomVideoSrc, logRoomChatMessage, setVideoPlayingProgress, getRoomUserInfo, checkIfMemberIsUserOfRoom, getFriendRequests, checkIfFriendrequestExists, submitShoutboxMessage, getMinimalUserInfo, createInviteCode, getRoomMembers, getRoomInfo, checkIfUserHasAccessToRoom, createRoom, addUserToRoom, getRoomFromJoincode, checkEmailOrUsernameExists, createUserAccount, createUserSessionFromPassword, getInitialData, getUserProfileData, validateSessionGetUserid, getFriends, getLatestShoutboxMessages, getOnlineUsersList, updateUserOnlineState }