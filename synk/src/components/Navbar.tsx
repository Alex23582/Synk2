import styles from './Navbar.module.css'
import HomeIcon from '@/icons/home.svg'
import FriendIcon from '@/icons/friends.svg'
import PublicRoomsIcon from '@/icons/public.svg'
import ProfileIcon from '@/icons/person.svg'
import NewsIcon from '@/icons/news.svg'
import NotificationAddIcon from '@/icons/notificationadd.svg'
import BigPlusIcon from '@/icons/bigplus.svg'
import LoginIcon from '@/icons/login.svg'
import CreateAccountIcon from '@/icons/createaccount.svg'
import MenuIcon from '@/icons/menu.svg'
import NotificationIcon from '@/icons/notification.svg'
import Link from 'next/link';
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import useTranslation from '@/other/useTranslation';
import { useEffect, useState } from 'react'
import CreateRoomOverlay from './CreateRoomOverlay'
import useGlobalContext from '@/other/useGlobalContext'
import LoginOverlay from './LoginOverlay'
import useCookies from '@/other/useCookies'
import { useMediaQuery } from 'usehooks-ts'


const inter = Inter({ subsets: ['latin'] })

function NavbarLink({ href, icon, text, overrideActive }: { href: string, icon: any, text: string, overrideActive?: boolean }) {
    const { pathname } = useRouter()
    let { getTranslation } = useTranslation()
    return <Link href={href} className={`${inter.className} ${styles.menuitem} ${pathname == href || overrideActive ? styles.activelink : ''}`}>
        <div className={styles.glowingdot} />
        <div className={styles.icon} style={{ backgroundImage: `url(${icon.src})` }} />
        {getTranslation(text)}
    </Link>
}

export default function Navbar() {
    const matchHook = useMediaQuery('(min-width: 700px)')
    const [matches, setmatches] = useState(false)
    let { loggedin, globalInitialData } = useGlobalContext()
    let { getTranslation } = useTranslation()
    const [createRoomOverlay, setcreateRoomOverlay] = useState(false)
    const [loginoverlay, setloginoverlay] = useState(false)
    const [registeroverlay, setregisteroverlay] = useState(false)
    const [force, setforce] = useState(false)
    const { setCookie } = useCookies()
    const router = useRouter()
    const { locale, pathname, asPath, query } = router
    function changeLanguage(newlang: string) {
        router.push({ pathname, query }, asPath, { locale: newlang })
    }
    useEffect(() => {
      setmatches(matchHook)
    }, [matchHook])
    
    return (
        <>
            {createRoomOverlay && <CreateRoomOverlay disable={() => { setcreateRoomOverlay(false) }} />}
            {loginoverlay && <LoginOverlay register={false} disable={() => { setloginoverlay(false) }} />}
            {registeroverlay && <LoginOverlay register={true} disable={() => { setregisteroverlay(false) }} />}
            {!matches && <button onClick={()=>{setforce(!force)}} className={styles.openmobilemenu} style={{backgroundImage: `url(${MenuIcon.src})`}} />}
            {(matches || force) && <>
                <div className={styles.body}>
                    <div className={styles.toppart}>
                        <h1 className={`${inter.className} ${styles.title}`}>Synk.vip</h1>
                        {loggedin && <>
                            <img src={globalInitialData.image} className={styles.fakeimage} />
                            <p className={`${inter.className} ${styles.username}`}>@{globalInitialData.username}</p>
                        </>}
                        {!loggedin &&
                            <div className={styles.logincontainer}>
                                <div onClick={() => {
                                    setloginoverlay(true)
                                }} className={`${inter.className} ${styles.menuitem}`}>
                                    <div className={styles.glowingdot} />
                                    <div className={styles.icon} style={{ backgroundImage: `url(${LoginIcon.src})` }} />
                                    {getTranslation("nav.login")}
                                </div>
                                <div onClick={() => {
                                    setregisteroverlay(true)
                                }} className={`${inter.className} ${styles.menuitem}`}>
                                    <div className={styles.glowingdot} />
                                    <div className={styles.icon} style={{ backgroundImage: `url(${CreateAccountIcon.src})` }} />
                                    {getTranslation("nav.createaccount")}
                                </div>
                            </div>
                        }
                        <NavbarLink href='/' icon={HomeIcon} text='nav.home' />
                        <NavbarLink href='/friends' icon={FriendIcon} text='nav.friends' />
                        {globalInitialData.friendrequests && globalInitialData.friendrequests.length > 0 &&
                            <Link href='/friends' className={`${inter.className} ${styles.menuitem} ${styles.activelink}`}>
                                <div style={{ opacity: 0 }} className={styles.glowingdot} />
                                <div className={styles.icon} style={{ backgroundImage: `url(${NotificationAddIcon.src})` }} />
                                {globalInitialData.friendrequests.length} {getTranslation("nav.newfriendrequests")}
                            </Link>
                        }
                        <NavbarLink href='/public' icon={PublicRoomsIcon} text='nav.publicrooms' />
                        <NavbarLink href='/news' icon={NewsIcon} text='nav.news' />
                        {loggedin && <>
                            <NavbarLink overrideActive={pathname == "/profile/[id]"} href={`/profile/${globalInitialData.userid}`} icon={ProfileIcon} text='nav.profile' />
                            <div onClick={() => { setcreateRoomOverlay(true) }} className={styles.createroomcontainer}>
                                <div className={styles.bigplusicon} style={{ backgroundImage: `url(${BigPlusIcon.src})` }} />
                                <p className={`${inter.className} ${styles.createroomtext}`}>{getTranslation("nav.createroom")}</p>
                            </div>
                        </>}
                    </div>
                    <div className={styles.toppart}>
                        <div className={styles.languagecontainer}>
                            <p onClick={() => { changeLanguage("en") }} className={`${inter.className} ${styles.languagechooser} ${locale == "en" ? styles.activelangue : ''}`}>EN</p>
                            <p onClick={() => { changeLanguage("de") }} className={`${inter.className} ${styles.languagechooser} ${locale == "de" ? styles.activelangue : ''}`}>DE</p>
                        </div>
                        <div className={styles.lastrowcontainer}>
                            <div onClick={() => {
                                setCookie("session", "", 0)
                                setCookie("sessionsecret", "", 0)
                                location.reload()
                            }} className={`${inter.className} ${styles.menuitem}`}>
                                <div className={styles.icon} style={{ backgroundImage: `url(${LoginIcon.src})` }} />
                                {getTranslation("nav.logout")}
                            </div>
                            <button className={styles.notificationmenu} style={{ backgroundImage: `url(${NotificationIcon.src})` }} />
                        </div>
                    </div>
                </div>
            </>}

        </>

    )
}
