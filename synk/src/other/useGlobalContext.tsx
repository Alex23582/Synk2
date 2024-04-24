import { useContext } from "react"
import { Context } from "./Context"

export default function useGlobalContext() {
    const context = useContext(Context)
    if (context === undefined) {
        throw new Error("useTodoContext must be within TodoProvider")
    }

    return context
}