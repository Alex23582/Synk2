import styles from './PropertySelector.module.css'
import { Inter } from 'next/font/google'
import LockIcon from '@/icons/lock.svg'
import ChatIcon from '@/icons/chat.svg'
import AdminIcon from '@/icons/admin.svg'
import WaitIcon from '@/icons/wait.svg'
import useTranslation from '@/other/useTranslation'
import ShareIcon from '@/icons/share.svg'
import ButtonWithIcon from '@/components/ButtonWithIcon';
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

function PropertyItem({ icon, text, size, setOutsideState, toggleable, onClick }: { icon: any, text: any, size?: string, setOutsideState?: Function, toggleable: boolean, onClick?: Function }) {
    const [enabled, setenabled] = useState(false)

    useEffect(() => {
        if(enabled && onClick){
            onClick()
        }
        if(!toggleable){
            setTimeout(() => {
                setenabled(false)
            }, 150);
          }
        if (setOutsideState)
            setOutsideState(enabled)
    }, [enabled])
    

    return <div className={styles.propertyitembody}>
        <div className={styles.icon} style={{ backgroundImage: `url(${icon.src})`, backgroundColor: enabled ? "#6C963D" : "#303435", backgroundSize: size ? size : "60%" }} onClick={() => { setenabled(!enabled) }} />
        <p style={{ color: enabled ? "#6C963D" : "#fff" }} className={`${inter.className} ${styles.propertyname}`}>{text}</p>
    </div>
}

export default function PropertySelector({ extended, setPrivate, setChatEnabled, inviteLink }: { extended: boolean, setPrivate?: Function, setChatEnabled?: Function, inviteLink: string }) {
    const { getTranslation } = useTranslation()
    return (
        <div className={styles.body}>
            {extended && <>
                <PropertyItem onClick={()=>{ navigator.clipboard.writeText(inviteLink) }} toggleable={false} size='47%' icon={ShareIcon} text={<><span>copy</span><br /><span>invite link</span></>} />
                {/*<PropertyItem toggleable={true} size='47%' icon={AdminIcon} text={<><span>admin</span><br /><span>controls</span></>} />*/}
            </>}
            <PropertyItem toggleable={true} setOutsideState={setPrivate} icon={LockIcon} text={<><span>private</span><br /><span>room</span></>} />
            <PropertyItem toggleable={true} setOutsideState={setChatEnabled} icon={ChatIcon} text={<><span>enable</span><br /><span>chat</span></>} />
        </div>
    )
}
