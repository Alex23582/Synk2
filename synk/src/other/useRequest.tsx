import { useState } from "react"

export default function useRequest() {
    const [loading, setloading] = useState(false)
    async function makeRequest(path: string, body?: object) {
        setloading(true)
        let response = await fetch(process.env.NEXT_PUBLIC_BACKEND + path, {
            method: body ? "POST" : "GET",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        })
        setloading(false)
        return await response.json()
    }
    return { makeRequest, loading }
}