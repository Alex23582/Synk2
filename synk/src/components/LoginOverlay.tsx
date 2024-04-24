import Button from './Button'
import ButtonWithIcon from './ButtonWithIcon'
import styles from './LoginOverlay.module.css'
import { Inter } from 'next/font/google'
import useCookies from '@/other/useCookies'
import GoogleIcon from '@/icons/google.svg'
import TeamspeakIcon from '@/icons/teamspeak.svg'
import useRequest from '@/other/useRequest'
import { KeyboardEventHandler, useState } from 'react'
import useGlobalContext from '@/other/useGlobalContext'
import TeamspeakLoginOverlay from './TeamspeakLoginOverlay'
import { useRouter } from 'next/router'

const inter = Inter({ subsets: ['latin'] })

export default function LoginOverlay({ disable, register }: { disable: Function, register: boolean }) {
    let { setloggedin } = useGlobalContext()
    const { setCookie } = useCookies()
    const [regUsername, setregUsername] = useState("")
    const [regEmail, setregEmail] = useState("")
    const [password, setpassword] = useState("")
    const [repeatPassword, setrepeatPassword] = useState("")
    const [usernameOrEmail, setusernameOrEmail] = useState("")
    const [errormessage, seterrormessage] = useState("")
    const { makeRequest, loading } = useRequest()
    const [teamspeakAuthOverlayActive, setteamspeakAuthOverlayActive] = useState(false)
    const router = useRouter()

    async function requestAuth() {
        let response = null;
        if (register) {
            if (repeatPassword != password) {
                seterrormessage("Passwords don't match")
                return;
            }
            seterrormessage("")
            response = await makeRequest("/createaccount", {
                username: regUsername,
                email: regEmail,
                password: password
            })
        } else {
            response = await makeRequest("/createsession", {
                usernameoremail: usernameOrEmail,
                password: password,
            })
        }
        if (response.error) {
            seterrormessage(response.message)
            return
        }
        setCookie("session", response.sessionid, 2)
        setCookie("sessionsecret", response.sessionsecret, 2)
        setloggedin(true)

        const params = new URLSearchParams(window.location.search);
        if (params.get("login")) {
            router.push({
                pathname: "/join/[joincode]",
                query: {
                    joincode: params.get("next")
                }
            }).then(()=>{router.reload()})
        }
        disable()
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            requestAuth()
        }
    }

    return (
        <div onClick={
            (e) => {
                if (e.target === e.currentTarget)
                    disable()
            }
        } className={styles.body}>
            <div className={styles.box}>
                <p className={`${inter.className} ${styles.title}`}>{register ? "Create Account" : "Log in"}</p>
                {!register && <input onKeyDown={handleKeyDown} value={usernameOrEmail} onChange={(e) => { setusernameOrEmail(e.target.value) }} placeholder='Username / Email' className={`${inter.className} ${styles.input}`} />}
                {register && <>
                    <input onKeyDown={handleKeyDown} value={regUsername} onChange={(e) => { setregUsername(e.target.value) }} placeholder='Username' className={`${inter.className} ${styles.input}`} />
                    <input onKeyDown={handleKeyDown} value={regEmail} onChange={(e) => { setregEmail(e.target.value) }} placeholder='Email-Address' className={`${inter.className} ${styles.input}`} />
                </>}
                <input onKeyDown={handleKeyDown} value={password} onChange={(e) => { setpassword(e.target.value) }} placeholder='Password' type='password' className={`${inter.className} ${styles.input}`} />
                {register && <input onKeyDown={handleKeyDown} value={repeatPassword} onChange={(e) => { setrepeatPassword(e.target.value) }} placeholder='Repeat password' type='password' className={`${inter.className} ${styles.input}`} />}
                <div className={styles.checkboxcontainer}>
                    <input type="checkbox" id="rememberlogin" />
                    <label className={`${inter.className} ${styles.checkboxtext}`} htmlFor="rememberlogin">Remember me for 7 days</label>
                </div>
                {errormessage && <p className={`${inter.className} ${styles.errormessage}`}>{errormessage}</p>}
                <Button loading={loading} onClick={requestAuth} className={`${styles.button}`} text={register ? "Create Account" : "Login"} />
                <div className={styles.devidercontainer}>
                    <div className={styles.deviderline} />
                    <p className={inter.className}>or</p>
                    <div className={styles.deviderline} />
                </div>
                {/*<ButtonWithIcon className={styles.iconbutton} text='Login with Google' icon={GoogleIcon.src} />*/}
                <ButtonWithIcon onClick={() => { setteamspeakAuthOverlayActive(true) }} className={styles.iconbutton} text='Login with Teamspeak' icon={TeamspeakIcon.src} />
            </div>
            {teamspeakAuthOverlayActive && <TeamspeakLoginOverlay disable={() => { setteamspeakAuthOverlayActive(false) }} />}
        </div>
    )
}
