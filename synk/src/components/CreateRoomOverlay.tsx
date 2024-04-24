import styles from './CreateRoomOverlay.module.css'
import PropertySelector from './PropertySelector'
import Button from './Button'
import { Inter } from 'next/font/google'
import useRequest from '@/other/useRequest'
import useCookies from '@/other/useCookies'
import { useRouter } from 'next/router'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function CreateRoomOverlay({ disable }: { disable: Function }) {
    const router = useRouter()
    const { makeRequest, loading } = useRequest()
    const { getAuthObject } = useCookies()
    const [chatEnabled, setchatEnabled] = useState(false)
    const [privateRoom, setPrivateRoom] = useState(false)

    const [roomname, setroomname] = useState("")

    async function createRoom() {
        const result = await makeRequest("/createRoom", {
            name: roomname,
            public: !privateRoom,
            chat: chatEnabled,
            ...getAuthObject()
        })
        if(result.error){
            return
        }
        disable()
        router.push({
            pathname: "/room/[id]",
            query: {
                id: result.roomid
            }
        }).then(()=>{
            router.reload()
        })
    }

    return (
        <div onClick={
            (e) => {
                if (e.target === e.currentTarget)
                    disable()
            }
        } className={styles.body}>
            <div className={styles.box}>
                <p className={`${inter.className} ${styles.title}`}>Create a room</p>
                <input value={roomname} onChange={(e)=>{setroomname(e.target.value)}} placeholder='Your room name' className={styles.input} />
                <PropertySelector inviteLink='' setChatEnabled={setchatEnabled} setPrivate={setPrivateRoom} extended={false} />
                <div className={styles.buttoncontainer}>
                    <Button onClick={() => { disable() }} className={styles.cancelbutton} text='Cancel' />
                    <Button onClick={createRoom} loading={loading} text='Confirm' />
                </div>
            </div>
        </div>
    )
}
