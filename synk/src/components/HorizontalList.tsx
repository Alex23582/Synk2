import styles from './HorizontalList.module.css'
import { Inter } from 'next/font/google'

import ArrowIcon from '@/icons/arrow.svg'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function HorizontalList(props: any) {
    const { title, className, href }: { title?: string, className?: string, href: string } = props
    return (
        <div className={`${className} ${styles.body}`}>
            {title &&
                <div className={styles.titleandarrowcontainer}>
                    <Link href={href} className={`${inter.className} ${styles.title}`}>{title}</Link>
                    <div className={styles.arrowicon} style={{ backgroundImage: `url(${ArrowIcon.src})` }} />
                </div>
            }
            <div className={styles.list}>
                {props.children}
                <div /> {/* magic placeholder to fix layout */}
            </div>
        </div>
    )
}
