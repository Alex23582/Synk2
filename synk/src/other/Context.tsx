import { ScriptProps } from "next/script";
import { createContext, useEffect, useState } from "react";
import useCookies from "./useCookies";
import useRequest from "./useRequest";
import useSocketIO from "./useSocketIO"

let Context = createContext<globalstate | undefined>(undefined);

export default function ContextProvider(props: ScriptProps) {
    const useSocketInstance = useSocketIO()
    const { getCookie, getAuthObject } = useCookies()
    const { makeRequest } = useRequest()
    const [loggedin, setloggedin] = useState(false)
    const [globalInitialData, setglobalInitialData] = useState<globalInitialData>({
        username: "",
        userid: -1,
        friendrequests: [],
        image: ""
    })
    const initialState: globalstate = {
        loggedin,
        setloggedin,
        globalInitialData,
        useSocketInstance,
        setglobalInitialData
    }

    async function fetchInitialData() {
        let result = await makeRequest("/getInitialData", getAuthObject())
        if (result.error) {
            setloggedin(false)
            return
        }
        setglobalInitialData(result)
    }

    useEffect(() => {
        if (loggedin) {
            fetchInitialData()
        }
    }, [loggedin])

    useEffect(() => {
        if (getCookie("session") && getCookie("sessionsecret")) {
            setloggedin(true)
        }
        if (!useSocketInstance.socket)
            useSocketInstance.connect()
    }, [useSocketInstance.clientserverdelta])



    return (
        <Context.Provider value={initialState}>
            {props.children}
        </Context.Provider>
    )

}

export { ContextProvider, Context }
