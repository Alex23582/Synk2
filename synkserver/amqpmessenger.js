const amqplib = require('amqplib');

var globalamqpconnection = null
var globalAmqpSender = null

var roomsubscriptions = {}

async function startAmqpMessenger(subscriptions) {
    const conn = await amqplib.connect('amqp://' + process.env.AMQPURL);
    const chan = await conn.createChannel();

    chan.assertExchange("shoutboxexchange", "fanout")
    const queue = await chan.assertQueue('', { exclusive: true });
    await chan.bindQueue(queue.queue, "shoutboxexchange", '');

    chan.consume(queue.queue, (msg) => {
        let unparsedjson = msg.content.toString();
        subscriptions["shoutbox"].forEach((socket) => {
            socket.emit("shoutbox", unparsedjson)
        })
        chan.ack(msg)
    })

    globalamqpconnection = conn
    globalAmqpSender = await conn.createChannel()
    console.log("ok")
};

async function joinRoomExchange(roomid) {
    console.log("connected to message-channel for room " + roomid)
    const chan = await globalamqpconnection.createChannel();

    chan.assertExchange("room_" + roomid, "fanout")
    const queue = await chan.assertQueue('', { exclusive: true });
    await chan.bindQueue(queue.queue, "room_" + roomid, '');

    chan.consume(queue.queue, (msg) => {
        let unparsedjson = msg.content.toString();
        const subscribers = roomsubscriptions[roomid]
        for (let i = 0; i < subscribers.length; i++) {
            let subscriber = subscribers[i]
            subscriber.emit("roommessage", unparsedjson)
        }
        chan.ack(msg)
    })
}

async function teamspeakAuthRequest(message, callback) {
    let channel = await (globalamqpconnection.createChannel())
    const response = await channel.assertQueue('');
    channel.consume(response.queue, async (msg) => {
        if (await callback(msg.content.toString())) {
            channel.close();
        }
    });
    const request = Buffer.from(JSON.stringify(message))
    await channel.sendToQueue('teamspeak_auth_request', request, {
        replyTo: response.queue, // Use the dynamically created response queue
    });
}

module.exports = { startAmqpMessenger, getGlobalAmqpSender: () => globalAmqpSender, getGlobalamqpconnection: () => globalamqpconnection, teamspeakAuthRequest, joinRoomExchange, roomsubscriptions }