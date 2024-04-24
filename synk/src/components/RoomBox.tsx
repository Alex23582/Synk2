import { useState } from 'react'
import styles from './RoomBox.module.css'
import RoomUserList from './RoomUserList'
import { Inter } from 'next/font/google'
import Button from './Button'

const inter = Inter({ subsets: ['latin'] })

export default function RoomBox({ room }: { room: extendedroom }) {
    const [popup, setpopup] = useState(false)
    return (
        <>
            {popup &&
                <div onClick={(e) => {
                    if (e.target === e.currentTarget)
                        setpopup(false)
                }} className={styles.popupoverlay}>
                    <div className={styles.popupbody}>
                        <p className={`${inter.className} ${styles.roomname}`}>{room.name}</p>
                        <p className={`${inter.className} ${styles.subinfo}`}>opened 3 hours ago • 4 members</p>
                        <Button className={styles.button} text='Join' />
                        <RoomUserList limit={false} users={room.members} />
                    </div>
                </div>
            }
            <div className={styles.body}>
                <p onClick={() => { setpopup(true) }} className={`${inter.className} ${styles.roomname} ${styles.clickableroomname}`}>{room.name}</p>
                <p className={`${inter.className} ${styles.subinfo}`}>opened 3 hours ago • 4 members</p>
                <RoomUserList onClick={() => { setpopup(true) }} limit={true} users={room.members} />
            </div>
        </>
    )
}
