import styles from './UserChatMessage.module.css'
import { Inter } from 'next/font/google'
import useTranslation from '@/other/useTranslation'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function UserChatMessage({ message }: { message: UserChatMessage }) {
    const { getTranslation } = useTranslation()
    return (
        <Link href={`/profile/${message.author.id}`} className={styles.body}>
            <div style={{backgroundImage: `url(${message.author.image})`}} className={styles.image} />
            <div className={styles.vertdiv}>
                <p className={`${inter.className} ${styles.authorname}`}>{message.author.name}</p>
                <p className={`${inter.className} ${styles.message}`}>{message.message}</p>
            </div>
        </Link>
    )
}
