import { Inter } from 'next/font/google';
import AddFriendIcon from '@/icons/addfriend.svg'
import RemoveFriendIcon from '@/icons/removefriend.svg'
import SettingsIcon from '@/icons/settings.svg'
import AccountSettingsOverlay from '@/components/AccountSettingsOverlay';
import styles from '@/styles/ProfilePage.module.css'
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import useRequest from '@/other/useRequest';
import useCookies from '@/other/useCookies';
import IconOnlyButton from '@/components/IconOnlyButton';
import useTranslation from '@/other/useTranslation';
import useGlobalContext from '@/other/useGlobalContext';
import Button from '@/components/Button';
const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps: GetServerSideProps<userProfilePage> = async (context) => {
    const id = context.params?.id
    const res = await fetch(process.env.BACKEND_LOCAL_URL + "/getProfilePageData", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userid: id,
            session: context.req.cookies["session"],
            sessionsecret: context.req.cookies["sessionsecret"]
        }),
    })
    const profiledata = await res.json()
    //console.log(profiledata)
    return { props: { ...profiledata, id } }
}

export default function ProfilePage({ username, online, joined, id, friendRequestSent, requestAccepted, receivedRequest, image }: userProfilePage) {
    const [accountSettingsVisible, setaccountSettingsVisible] = useState(false)
    const { globalInitialData } = useGlobalContext()
    const { getTranslation } = useTranslation()
    const { makeRequest: makeFriendRequest, loading: friendRequestLoading } = useRequest()
    const { getAuthObject } = useCookies()
    const [friendRequestState, setfriendRequestState] = useState(friendRequestSent)
    const [requestAcceptedState, setrequestAcceptedState] = useState(requestAccepted)
    const [receivedRequestState, setreceivedRequestState] = useState(receivedRequest)
    const [formattedJoinedDate, setformattedJoinedDate] = useState("")
    useEffect(() => {
        const date = new Date(joined * 1000)
        setformattedJoinedDate(date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear())
    }, [joined])

    async function sendFriendRequest() {
        const response = await makeFriendRequest("/sendFriendRequest", {
            target: id,
            ...getAuthObject()
        })
        if (!response.error) {
            setfriendRequestState(true)
        }
    }

    async function deleteFriendship() {
        const response = await makeFriendRequest("/deleteFriendship", {
            target: id,
            ...getAuthObject()
        })
        if (!response.error) {
            setfriendRequestState(false)
            setrequestAcceptedState(false)
            setreceivedRequestState(false)
        }
    }

    async function acceptFriendRequest() {
        const response = await makeFriendRequest("/acceptFriendRequest", {
            requester: id,
            ...getAuthObject()
        })
        if(!response.error){
            setrequestAcceptedState(true)
            setreceivedRequestState(false)
        }
    }

    return <div className={styles.body}>
        <div className={styles.profilebox}>
            <img src={image} className={styles.profileimage} />
            <p className={`${inter.className} ${styles.profilename}`}>@{username}</p>
            <p className={`${inter.className} ${styles.subtext}`} style={online ? { color: "#6C963D", fontSize: "1rem" } : {}}>{online ? "Online" : "Offline"}</p>
            <p className={`${inter.className} ${styles.subtext}`}>joined {formattedJoinedDate}</p>
            {!receivedRequestState && !requestAcceptedState && friendRequestState && <p className={`${inter.className} ${styles.friendrequestnotacceptedtext}`}>{getTranslation("profile.friendrequestsendbutnotaccepted")}</p>}
            {receivedRequestState && !requestAccepted && <Button loading={friendRequestLoading} onClick={acceptFriendRequest} className={styles.acceptFriendRequestButton} text='Accept friend request' />}
            <div className={styles.iconscontainer}>
                {(!receivedRequestState || requestAccepted) && globalInitialData.userid != id && friendRequestState && <IconOnlyButton loading={friendRequestLoading} onClick={deleteFriendship} iconSrc={RemoveFriendIcon.src} />}
                {!receivedRequestState && globalInitialData.userid != id && !friendRequestState && <IconOnlyButton loading={friendRequestLoading} onClick={sendFriendRequest} iconSrc={AddFriendIcon.src} />}
                {globalInitialData.userid == id && <IconOnlyButton onClick={()=>{setaccountSettingsVisible(true)}} loading={false} iconSrc={SettingsIcon.src} />}
            </div>
            {accountSettingsVisible && <AccountSettingsOverlay disable={()=>{setaccountSettingsVisible(false)}} />}
        </div>
    </div>
}