import { Inter } from 'next/font/google'
import styles from '@/styles/Public.module.css'
const inter = Inter({ subsets: ['latin'] })
import useTranslation from '@/other/useTranslation'
import HorizontalList from '@/components/HorizontalList'
import ExtendedUserBox from '@/components/ExtendedUserBox'
import RoomBox from '@/components/RoomBox'

export default function Public() {
  const { getTranslation } = useTranslation()

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
      ],
    }
  ]

  return (
    <div className={styles.body}>
      <p className={`${inter.className} ${styles.bigstarttext}`}>{getTranslation("nav.publicrooms")}</p>
      <HorizontalList className={styles.horizontalList}>
        {rooms.map((room, i) => {
          return <RoomBox key={i} room={room} />
        })}
      </HorizontalList>
    </div>
  )
}
