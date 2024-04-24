import styles from './OnlineUsers.module.css'
import { Inter } from 'next/font/google'
import useTranslation from '@/other/useTranslation'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function OnlineUsers({ users, className }: { users: minimaluser[], className?: string }) {
    const { getTranslation } = useTranslation()
    return (
        <div className={`${className} ${styles.body}`}>
            <p className={`${inter.className} ${styles.title}`}>{users.length} {getTranslation("home.onlineusers")}</p>
            <div className={styles.userlist}>
                {users.map((user, i) => {
                    return <Link href={`/profile/${user.id}`} key={i} className={styles.userbox}>
                        <div style={{backgroundImage: `url(${user.image})`}} className={styles.image} />
                        <div className={styles.userinfocontainer}>
                            <p className={`${inter.className} ${styles.username}`}>{user.name}</p>
                            <p className={`${inter.className} ${styles.userstatus}`}>online</p>
                        </div>
                    </Link>
                })}
            </div>
        </div>
    )
}
