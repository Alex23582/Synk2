import useGlobalContext from '@/other/useGlobalContext';
import ChatBox from './ChatBox';
import { useEffect, useState } from 'react';
export default function RoomChat() {

    const [chatMessages, setchatMessages] = useState<UserChatMessage[]>([])
    const { useSocketInstance: { socket, clientserverdelta }, globalInitialData } = useGlobalContext()

    useEffect(() => {
        if (!socket) {
            return
        }
        socket.on("roommessage", messageReceived)
        return () => {
            socket.off("roommessage", messageReceived)
        }
    }, [socket, chatMessages])

    function messageReceived(unparsedJson: string){
        const json = JSON.parse(unparsedJson)
        if (json.type == "chat") {
            setchatMessages([...chatMessages, json.message])
        }
    }
    
    function sendChatMessage(message: string) {
        socket.emit("roomchatmessage", message)
        return true
    }

    return (
        <>
            <ChatBox disabled={false} newMessage={sendChatMessage} messages={chatMessages} name='Chat' />
        </>
    )
}
