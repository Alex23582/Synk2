import Link from 'next/link'
import styles from './ExtendedUserBox.module.css'
import { Inter } from 'next/font/google'
import AcceptButton from '@/icons/accepticon.svg'
import CancelIcon from '@/icons/cancelicon.svg'

const inter = Inter({ subsets: ['latin'] })

export default function ExtendedUserBox({ user, friendRequestBox, friendRequestAccept }: { user: extendeduser, friendRequestBox?: boolean, friendRequestAccept?: Function }) {
    function handleFriendRequest(e: React.MouseEvent, accepted: boolean) {
        if (!friendRequestAccept) {
            return
        }
        e.preventDefault()
        friendRequestAccept(user.user.id, accepted)
    }
    return (
        <Link href={`/profile/${user.user.id}`} className={styles.userbox}>
            <div style={{ backgroundImage: `url(${user.user.image})` }} className={styles.profileimage} />
            <p className={`${inter.className} ${styles.username}`}>{user.user.name}</p>
            <p style={{ color: user.status ? "#6C963D" : "#939397" }} className={`${inter.className} ${styles.userstatus}`}>{`${user.room ? 'In Room' : user.status ? 'online' : 'offline'}`}</p>
            {user.status && user.room && <p className={`${inter.className} ${styles.username}`}>{user.room.name}</p>}
            {friendRequestBox &&
                <div className={styles.friendshipoptionsbox}>
                    <button onClick={(e) => { handleFriendRequest(e, true) }} style={{ backgroundImage: `url(${AcceptButton.src})` }} className={`${styles.friendshipbutton} ${styles.friendacceptbutton}`} />
                    <button onClick={(e) => { handleFriendRequest(e, false) }} style={{ backgroundImage: `url(${CancelIcon.src})` }} className={`${styles.friendshipbutton} ${styles.frienddeletebutton}`} />
                </div>
            }
        </Link>
    )
}
