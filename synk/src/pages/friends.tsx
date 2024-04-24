import { Inter } from 'next/font/google'
import styles from '@/styles/Friends.module.css'
const inter = Inter({ subsets: ['latin'] })
import useTranslation from '@/other/useTranslation'
import HorizontalList from '@/components/HorizontalList'
import ExtendedUserBox from '@/components/ExtendedUserBox'
import useRequest from '@/other/useRequest'
import { useEffect, useState } from 'react'
import useCookies from '@/other/useCookies'
import useGlobalContext from '@/other/useGlobalContext'

export default function Friends() {
  const { getTranslation } = useTranslation()
  const { makeRequest } = useRequest()
  const { getAuthObject } = useCookies()
  const { globalInitialData, setglobalInitialData } = useGlobalContext()
  const [loggedin, setloggedin] = useState(false)
  const [initialUpdateCompleted, setinitialUpdateCompleted] = useState(false)

  const [pageData, setpageData] = useState<{ friendrequests: friendrequest[], friends: extendeduser[] }>({ friendrequests: [], friends: [] })

  useEffect(() => {
    if (!initialUpdateCompleted) {
      updatePageData()
    }
  }, [globalInitialData, initialUpdateCompleted])

  async function updatePageData() {
    setloggedin(globalInitialData.userid != -1)
    if (globalInitialData.userid == -1) {
      return
    }
    setinitialUpdateCompleted(true)
    const res = await makeRequest("/getFriendPageData", getAuthObject())
    setpageData(res)
    setglobalInitialData({ ...globalInitialData, friendrequests: res.friendrequests })
  }

  async function friendRequestAccept(userid: number, accepted: boolean) {
    const url = accepted ? "/acceptFriendRequest" : "/deleteFriendship"
    const body = accepted ? { requester: userid } : { target: userid }
    await makeRequest(url, {
      ...body,
      ...getAuthObject()
    })
    updatePageData()
  }

  if (!loggedin) {
    return (
      <div className={styles.body}>
        <p className={`${inter.className} ${styles.bigstarttext}`}>{getTranslation("general.notloggedin")}</p>
      </div>
    )
  }

  return (
    <div className={styles.body}>
      <p className={`${inter.className} ${styles.bigstarttext}`}>{getTranslation("friends.requests")}</p>
      <HorizontalList>
        {pageData.friendrequests.map((friendrequest, i) => {
          return <ExtendedUserBox key={i} friendRequestBox={true} friendRequestAccept={friendRequestAccept} user={friendrequest.requester} />
        })}
        {pageData.friendrequests.length == 0 && <p className={`${inter.className} ${styles.emptyinfotext}`}>{getTranslation("friends.nofriendrequests")}</p>}
      </HorizontalList>
      <p className={`${inter.className} ${styles.bigstarttext}`}>{getTranslation("friends.start")}</p>
      <HorizontalList className={styles.horizontalList}>
        {pageData.friends.map((user, i) => {
          return <ExtendedUserBox key={i} user={user} />
        })}
      </HorizontalList>
    </div>
  )
}
