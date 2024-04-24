import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import styles from '@/styles/WatchRoom.module.css'
import RoomUserList from '@/components/RoomUserList';
import PropertySelector from '@/components/PropertySelector';
import useCookies from '@/other/useCookies'
import useRequest from '@/other/useRequest'
import { useEffect, useState } from 'react';
import useGlobalContext from '@/other/useGlobalContext';
import RoomChat from '@/components/RoomChat';
import RoomVideoPlayer from '@/components/RoomVideoPlayer';
import Button from '@/components/Button';
const inter = Inter({ subsets: ['latin'] })
export default function WatchRoom() {
    const { useSocketInstance: { socket, authsuccess }, globalInitialData } = useGlobalContext()
    const { getCookie } = useCookies()
    const router = useRouter();
    const { makeRequest } = useRequest()
    const { getAuthObject } = useCookies()
    const [roomData, setroomData] = useState<roomdata>()
    let forceUpdateFunction = (data: roomdata) => { console.log("ForceUpdatFunction not set yet") }

    useEffect(() => {
        if (!getCookie("session") || !getCookie("sessionsecret")) {
            router.push("/")
        }
    }, [])

    useEffect(() => {
        updatePageData(false)
    }, [router, authsuccess])

    async function updatePageData(force: boolean) {
        if (!force) {
            if (!router.query.id) {
                return
            }
            if (roomData) {
                return
            }
            if (!authsuccess) {
                return
            }
        }
        const res = await makeRequest("/getRoomData/" + router.query.id, getAuthObject())
        setroomData(res)
        socket.emit("joinroom", res.id)
        return res
    }

    async function socketDisconnect() {
        let i = setInterval(() => {
            socket.connect();
        }, 1000);

        let callback = async () => {
            clearInterval(i)
            const roomDataRes = await updatePageData(true)
            forceUpdateFunction(roomDataRes)
            socket.off(callback)
        }
        socket.on("authsuccess", callback)

    }

    useEffect(() => {
        if (!socket || !roomData) {
            return
        }
        socket.on("roommessage", messageReceived)
        socket.on("disconnect", socketDisconnect)
        return () => {
            socket.off("roommessage", messageReceived)
            socket.off("disconnect", socketDisconnect)
        }
    }, [socket, roomData])

    function messageReceived(unparsedJson: string) {
        const json = JSON.parse(unparsedJson)
        if (json.type == "newuser") {
            if (globalInitialData.userid == -1) {
                return
            }
            if (json.user.user.id == globalInitialData.userid) {
                return
            }
            if (!roomData) {
                return
            }
            setroomData({
                ...roomData,
                users: [...roomData.users, json.user]
            })
        }
        if (json.type == "removeuser") {
            if (!roomData) {
                return
            }
            setroomData({
                ...roomData,
                users: roomData.users.filter((user) => {
                    return user.user.id != json.id
                })
            })
        }
    }

    const [newUrlInput, setnewUrlInput] = useState("")

    function updateURL() {
        socket.emit("changeurl", newUrlInput)
        setnewUrlInput("")
    }


    return <div className={styles.body}>
        <h2 className={`${inter.className} ${styles.title}`}>Room: {roomData?.roomname}</h2>
        {roomData && <RoomUserList limit={false} users={roomData.users} />}
        <RoomVideoPlayer roomdata={roomData} forceUpdateCallback={(func: (data: roomdata) => void) => { forceUpdateFunction = func }} />
        <div className={styles.controlsectiondevider}>
            <div className={styles.controlsection}>
                <div className={styles.updateurlcontainer}>
                    <input value={newUrlInput} onChange={(e) => { setnewUrlInput(e.target.value) }} placeholder='Enter Video-URL' className={`${inter.className} ${styles.urlinput}`} />
                    {newUrlInput.length > 5 && newUrlInput != roomData?.current_url && <Button onClick={updateURL} text='Update' />}
                </div>
                <PropertySelector inviteLink={roomData ? roomData?.invitecode : ""} extended={true} />
            </div>
            <RoomChat />
        </div>
    </div>
}