import styles from './ChatBox.module.css'
import { Inter } from 'next/font/google'
import SendIcon from '@/icons/send.svg'
import useTranslation from '@/other/useTranslation'
import UserChatMessage from './UserChatMessage'
import { useEffect, useRef, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function ChatBox({ name, notice, messages, newMessage, disabled, disabledMessage }: { name: string, notice?: string, messages: UserChatMessage[], newMessage: Function, disabled: boolean, disabledMessage?: string }) {
    const { getTranslation } = useTranslation()
    const [messageInputField, setmessageInputField] = useState("")
    const messagesEndRef = useRef<null | HTMLDivElement>(null)
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant", block: 'nearest' } as any)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages]);
    const sendNewMessage = () => {
        if(messageInputField.length == 0){
            return
        }
        if (newMessage(messageInputField)) {
            setmessageInputField("")
        }
    }
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendNewMessage()
        }
    }
    return (
        <div className={styles.body}>
            <div className={styles.toprow}>
                <p className={`${inter.className} ${styles.title}`}>{name}</p>
                {notice && <p className={`${inter.className} ${styles.notice}`}>{notice}</p>}
            </div>
            <div className={styles.messagecontainer}>
                {messages.map((message, i) => {
                    return <UserChatMessage key={i} message={message} />
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputcontainer}>
                <input disabled={disabled} placeholder={disabled ? disabledMessage : ''} onKeyDown={handleKeyDown} value={messageInputField} onChange={(e) => {
                    setmessageInputField(e.target.value)
                }} />
                <button onClick={sendNewMessage} style={{ backgroundImage: `url(${SendIcon.src})` }} />
            </div>
        </div>
    )
}
