import { useEffect, useState } from 'react'
import styles from './TeamspeakLoginOverlay.module.css'
import { Inter } from 'next/font/google'
import useRequest from '@/other/useRequest'
import Button from './Button'
import useSocketIO from '@/other/useSocketIO'
import useGlobalContext from '@/other/useGlobalContext'
import useCookies from '@/other/useCookies'
const inter = Inter({ subsets: ['latin'] })

interface selectableAccount {
    name: string;
    id: number;
}

export default function TeamspeakLoginOverlay({ disable }: { disable: Function }) {
    const { makeRequest } = useRequest()
    const [accounts, setaccounts] = useState<selectableAccount[]>([])
    const { setCookie } = useCookies()
    const [authProgress, setauthProgress] = useState(0)
    const [verificationCode, setverificationCode] = useState("")
    let { useSocketInstance: { socket, send } } = useGlobalContext()

    useEffect(() => {
        makeRequest("/requestTeamspeakAuthUsers").then(setaccounts)
        socket.on("teamspeakCode", (message: string) => {
            setverificationCode(message)
            setauthProgress(1)
        })
        socket.on("teamspeakSessionResponse", (session: {sessionid: string, sessionsecret: string}) => {
            setCookie("session", session.sessionid, 3)
            setCookie("sessionsecret", session.sessionsecret, 3)
            location.reload()
        })
    }, [socket])

    async function selectAccount(account: selectableAccount) {
        send("requestTeamspeakAuth", { id: account.id })
    }

    /*async function selectAccount(account: selectableAccount){
        const code = await makeRequest("/requestTeamspeakAuthCode", {
            clientid: account.id
        })
        setverificationCode(code.code)
        setauthProgress(1)
    }*/

    return (
        <div onClick={
            (e) => {
                if (e.target === e.currentTarget)
                    disable()
            }
        } className={styles.body}>
            <div className={styles.box}>
                {authProgress == 0 && <>
                    <p className={`${inter.className} ${styles.title}`}>Select your account-name</p>
                    {accounts.map((account, i) => {
                        return <Button key={i} onClick={() => { selectAccount(account) }} className={styles.accountbutton} text={account.name} />
                    })}
                </>}
                {authProgress == 1 && <>
                    <p className={`${inter.className} ${styles.title}`}>Answer with this code</p>
                    <p className={`${inter.className} ${styles.verificationcode}`}>{verificationCode}</p>
                    <Button onClick={() => { navigator.clipboard.writeText(verificationCode) }} text='Copy' />
                </>}
            </div>
        </div>
    )
}