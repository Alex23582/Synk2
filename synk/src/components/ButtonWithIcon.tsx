import { MouseEventHandler } from 'react'
import styles from './ButtonWithIcon.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function ButtonWithIcon({icon, text, onClick, className}: {icon: string, text: string, onClick?: MouseEventHandler<HTMLButtonElement>, className?: string}) {
    return (
        <button onClick={onClick} className={`${inter.className} ${styles.body} ${className}`}>
            <div style={{backgroundImage: `url(${icon})`}} className={styles.icon} />
            {text}
        </button>
    )
}
