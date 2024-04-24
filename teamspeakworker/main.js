const { TeamSpeak } = require("ts3-nodejs-library")
const amqplib = require('amqplib');
require('dotenv').config()

let userCodeMaps = {};

(async () => {
    let teamspeak = await TeamSpeak.connect({
        host: "teamspeak.bet",
        serverport: 9987,
        username: "serveradmin",
        password: "ffe0+nlT",
        nickname: "• Synk •",
    })

    /*let client = await teamspeak.getClientByUid("APE8vknT+jhxc3CCsN6Ga44z5CE=")
    for (let i = 0; i < 10000; i++) {
        console.log(i)
        await client.poke(i)
    }*/

    const conn = await amqplib.connect('amqp://' + process.env.AMQPURL);
    const chan = await conn.createChannel();

    const requestQueue = 'teamspeak_auth_request';

    await chan.assertQueue(requestQueue, { durable: false });

    chan.consume(requestQueue, async (message) => {
        const request = JSON.parse(message.content.toString());
        chan.ack(message);
        console.log(request)
        let responsemessage = {}
        if (request.type == "getclientsforip") {
            let clients = await teamspeak.clientList({ clientType: 0 })
            clients = clients.filter((client) => {
                return client.connectionClientIp == request.ip
            })
            clients = clients.map((client) => {
                return {
                    name: client.nickname,
                    id: client.clid
                }
            })
            responsemessage = clients
        }
        if (request.type == "sendverificationcode") {
            let client = await teamspeak.getClientById(request.clientid)
            if (client.connectionClientIp != request.ip) {
                return
            }
            userCodeMaps[client.clid] = {
                code: request.verificationcode,
                callback: (username, identity) => {
                    console.log("CALLBACk")
                    chan.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify({ progress: 1, username, identity })));
                }
            }
            teamspeak.sendTextMessage(client.clid, 1,
                "Please verify your Synk-Login.\nEnter the code from Synk:")
            responsemessage = { progress: 0 }
        }
        chan.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify(responsemessage)));
    })

    teamspeak.on("textmessage", async (message) => {
        if (message.invoker.clid == (await teamspeak.whoami()).clientId) {
            return
        }
        console.log(1)
        if (userCodeMaps[message.invoker.clid] && message.msg.toUpperCase() == userCodeMaps[message.invoker.clid].code) {
            userCodeMaps[message.invoker.clid].callback(message.invoker.nickname, message.invoker.uniqueIdentifier)
        }
    })




})()

process.on('uncaughtException', function (error) {
    console.log(error.stack);
});