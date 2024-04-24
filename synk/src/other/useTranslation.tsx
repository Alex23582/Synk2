import { useRouter } from 'next/router'
import messages from '@/other/messages.json'


export default function useTranslation() {
    const { locale } = useRouter()
    function getTranslation(path: string){
        let lang = (messages as any)[locale as any]
        let paths = path.split(".")
        for(let i = 0; i < paths.length; i++){
            lang = lang[paths[i]] 
        }
        if(!lang){
            return path
        }
        return lang
    }
    return {getTranslation}
}