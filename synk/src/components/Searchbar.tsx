import styles from './Searchbar.module.css'
import SearchIcon from '@/icons/search.svg'
import { Inter } from 'next/font/google'
import useTranslation from '@/other/useTranslation'

const inter = Inter({ subsets: ['latin'] })

export default function Searchbar() {
    const {getTranslation} = useTranslation()
    return (
        <div className={styles.body}>
            <div className={styles.searchicon} style={{backgroundImage: `url(${SearchIcon.src})`}} />
            <input placeholder={getTranslation("home.searchhint")} className={inter.className} type="text" />
        </div>
    )
}
