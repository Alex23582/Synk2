import { MouseEventHandler } from 'react'
import styles from './Button.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Button({ text, onClick, className, loading }: { text: string, onClick?: MouseEventHandler<HTMLButtonElement>, className?: string, loading?: boolean }) {
    return (
        <button onClick={onClick} className={`${inter.className} ${styles.body} ${className}`}>
            {loading && <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite" /></path></svg>}
            {!loading && <>{text}</>}
        </button>
    )
}
