import { MouseEventHandler, useState } from 'react'
import styles from './RoomUserList.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

function UserBox({ user, onClick }: { user: minimalroomuser, onClick: any }) {
    return <div className={styles.userbox}>
        <div onClick={onClick} className={styles.userprofileimage} style={{ backgroundImage: `url(${user.user.image})` }} />
        <p onClick={onClick} className={`${inter.className} ${styles.username}`}>{user.user.name}</p>
        {user.isadmin && <p className={`${inter.className} ${styles.admintext}`}>admin</p>}
    </div>
}

export default function RoomUserList({ users, limit, onClick }: { users: minimalroomuser[], limit: boolean, onClick?: any }) {
    function handleClick(index?: number) {
        if (onClick) {
            onClick(index)
        }
    }
    return (
        <div className={`${styles.usercontainer} ${!limit ? styles.noevenspacing : ""}`}>
            {(!limit || users.length <= 4) &&
                users.map((user, i) => {
                    return <UserBox onClick={() => { handleClick(i) }} key={i} user={user} />
                })
            }
            {limit && users.length > 4 &&
                <>
                    {users.slice(0, 3).map((user, i) => {
                        return <UserBox onClick={()=>{handleClick()}} key={i} user={user} />
                    })}
                    <div onClick={()=>{handleClick()}} className={styles.userbox}>
                        <div className={`${styles.moreusers} ${inter.className}`}>
                            +{users.length - 3}
                        </div>
                        <p className={`${inter.className} ${styles.morename}`}>more</p>
                    </div>
                </>
            }
        </div>
    )
}
