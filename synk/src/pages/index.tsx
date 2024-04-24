import { Inter } from 'next/font/google'
import Searchbar from '@/components/Searchbar'
import styles from '@/styles/Home.module.css'
import useTranslation from '@/other/useTranslation'
import ChatBox from '@/components/ChatBox'
import OnlineUsers from '@/components/OnlineUsers'
import HorizontalList from '@/components/HorizontalList'
import ExtendedUserBox from '@/components/ExtendedUserBox'
import RoomBox from '@/components/RoomBox'
import useRequest from '@/other/useRequest'
import useCookies from '@/other/useCookies'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import useGlobalContext from '@/other/useGlobalContext'
import { GetServerSideProps } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const getServerSideProps: GetServerSideProps<{
  ssglobaldata: any,
  loggedin: boolean
}> = async (context) => {
  const res = await fetch(process.env.BACKEND_LOCAL_URL + "/getIndexPageData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: context.req.cookies["session"],
      sessionsecret: context.req.cookies["sessionsecret"]
    }),
  })
  const ssglobaldata = await res.json()
  return { props: { ssglobaldata, loggedin: true } }
}

export default function Home({ ssglobaldata, loggedin }: { ssglobaldata: ssglobaldata, loggedin: boolean }) {
  const matchHook = useMediaQuery('(min-width: 1050px)')
  const [matches, setmatches] = useState(false)
  const { useSocketInstance, loggedin: loggedinglobal } = useGlobalContext()
  const { getAuthObject } = useCookies()
  const { getTranslation } = useTranslation()
  const { makeRequest } = useRequest()
  const { subscribeToEvent, unsubscribeToEvent, connected } = useSocketInstance

  useEffect(() => {
    setmatches(matchHook)
  }, [matchHook])

  const [onlineUsers, setonlineUsers] = useState<minimaluser[]>([])

  useEffect(() => {
    if (ssglobaldata || loggedin) {
      setmessages(ssglobaldata.shoutbox)
      setonlineUsers(ssglobaldata.onlineusers)
    }
  }, [ssglobaldata])


  const users: minimaluser[] = [
    { id: 1, image: "https://randomuser.me/api/portraits/men/1.jpg", name: "Alice" },
    { id: 2, image: "https://randomuser.me/api/portraits/men/2.jpg", name: "Bob" },
    { id: 3, image: "https://randomuser.me/api/portraits/men/3.jpg", name: "Charlie" },
    { id: 4, image: "https://randomuser.me/api/portraits/men/4.jpg", name: "Dave" },
    { id: 5, image: "https://randomuser.me/api/portraits/men/5.jpg", name: "Eve" },
    { id: 6, image: "https://randomuser.me/api/portraits/men/6.jpg", name: "Frank" },
    { id: 7, image: "https://randomuser.me/api/portraits/men/7.jpg", name: "Grace" },
    { id: 8, image: "https://randomuser.me/api/portraits/men/8.jpg", name: "Harry" },
    { id: 9, image: "https://randomuser.me/api/portraits/men/9.jpg", name: "Ivy" },
    { id: 10, image: "https://randomuser.me/api/portraits/men/10.jpg", name: "Jack" }
  ];

  const [messages, setmessages] = useState<UserChatMessage[]>([])

  const rooms: extendedroom[] = [
    {
      id: 1,
      starttime: Date.now(),
      name: 'best movies only',
      members: [
        {
          isadmin: true,
          user: users[0]
        },
        {
          isadmin: false,
          user: users[1]
        },
        {
          isadmin: false,
          user: users[2]
        },
        {
          isadmin: false,
          user: users[3]
        },
      ],
    },
    {
      id: 2,
      starttime: Date.now(),
      name: 'better movies only',
      members: [
        {
          isadmin: true,
          user: users[0]
        },
        {
          isadmin: false,
          user: users[1]
        },
        {
          isadmin: false,
          user: users[2]
        },
        {
          isadmin: false,
          user: users[4]
        },
        {
          isadmin: false,
          user: users[5]
        },
        {
          isadmin: false,
          user: users[5]
        },
        {
          isadmin: false,
          user: users[5]
        },
      ],
    }
  ]

  async function sendShoutboxMessage(message: string) {
    let body: any = getAuthObject()
    body.message = message
    let response = await makeRequest("/submitShoutboxMessage", body)
    return !response.error
  }

  const [newShoutboxMessage, setnewShoutboxMessage] = useState(null)

  useEffect(() => {
    if (!connected) {
      return
    }
    let shoutBoxEvents = (data: any) => {
      setnewShoutboxMessage(JSON.parse(data))
    }
    subscribeToEvent("shoutbox", shoutBoxEvents)
    return () => {
      unsubscribeToEvent("shoutbox", shoutBoxEvents)
    }
  }, [connected])

  useEffect(() => {
    if (newShoutboxMessage == null) {
      return
    }
    let tempmessages = [...messages]
    tempmessages.push(newShoutboxMessage)
    setmessages(tempmessages)
  }, [newShoutboxMessage])

  return (
    <div className={styles.body}>
      <Searchbar />
      <p className={`${inter.className} ${styles.bigstarttext}`}>{getTranslation("home.bigstarttext")}</p>
      <p className={`${inter.className} ${styles.smallstarttext}`}>{getTranslation("home.smallstarttext")}</p>
      <div className={styles.firstrow}>
        <ChatBox disabled={!loggedinglobal} disabledMessage={getTranslation("home.logintochat")} newMessage={sendShoutboxMessage} messages={messages} name={getTranslation("home.shoutbox")} notice={getTranslation("home.englishonly")} />
        {matches && <OnlineUsers className={styles.onlineusers} users={onlineUsers} />}
      </div>
      <HorizontalList href="/friends" className={styles.horizontalList} title={`${ssglobaldata.onlineFriends ? ssglobaldata.onlineFriends.length : ""} Online Friends`}>
        {ssglobaldata.onlineFriends && ssglobaldata.onlineFriends.map((user, i) => {
          return <ExtendedUserBox key={i} user={user} />
        })}
      </HorizontalList>
      <HorizontalList href="/public" className={styles.horizontalList} title='Popular public Rooms'>
        {rooms.map((room, i) => {
          return <RoomBox key={i} room={room} />
        })}
      </HorizontalList>
    </div>
  )
}
