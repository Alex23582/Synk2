import { useEffect, useState } from "react"
import io, { Socket } from "socket.io-client"
import useCookies from "./useCookies"
import { DefaultEventsMap } from "socket.io/dist/typed-events"

export default function useSocketIO() {
  const { getCookie, getAuthObject } = useCookies()
  const [socket, setsocket] = useState<any>(null)
  const [connected, setconnected] = useState<boolean>(false)
  const [authsuccess, setauthsuccess] = useState(false)
  const [clientserverdelta, setclientserverdelta] = useState<number | undefined>(undefined)

  async function connect() {
    var socket = io(process.env.NEXT_PUBLIC_BACKEND_HOST as string, {
      transports: [ "websocket" ]
    });
    setsocket(socket)
    console.log("connecting")
    socket.on("connect", () => {
      setconnected(true)
      if (!getCookie("session") || !getCookie("sessionsecret")) {
        return
      }
      socket.emit("auth", getAuthObject())
      socket.on("authsuccess", ()=>{
        setauthsuccess(true)
      })
      setTimeout(() => {
        updateServerTime(socket)
      }, 100);
      setInterval(() => {
        updateServerTime(socket)
      }, 30 * 1000)

    })
    socket.on("disconnect", () => {
      setconnected(false)
    })
  }

  function updateServerTime(socket: Socket<DefaultEventsMap, DefaultEventsMap>) {
    const start = Date.now();
    socket.emit("pingtime", (servertime: number) => {
      const duration = Date.now() - start;
      const onewaytrip = duration / 2
      const realservertime = servertime + onewaytrip
      const clientserverdelta = Date.now() - realservertime
      console.log("server-client time difference: " + clientserverdelta)
      setclientserverdelta(clientserverdelta)
    })
  }

  function subscribeToEvent(type: string, callback: (data: object) => void) {
    socket.emit("subscribe", type)
    socket.on(type, callback)
  }

  function unsubscribeToEvent(type: string, callback: (data: object) => void) {
    socket.off(type, callback)
    socket.emit("unsubscribe", type)
  }

  async function send(type: string, message: object) {
    socket.emit(type, message)
  }

  return { connect, subscribeToEvent, send, unsubscribeToEvent, connected, socket, clientserverdelta, authsuccess }
}