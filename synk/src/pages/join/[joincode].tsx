import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.joincode
    const res = await fetch(process.env.BACKEND_LOCAL_URL + "/joinRoom", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            joincode: id,
            session: context.req.cookies["session"],
            sessionsecret: context.req.cookies["sessionsecret"]
        }),
    })
    const response = await res.json()
    console.log(response)
    if(!response.error){
        context.res.setHeader("Location", "/room/" + response.roomid)
        context.res.statusCode = 301
    }else{
        context.res.setHeader("Location", "/?login=1&next=" + id)
        context.res.statusCode = 301
    }
    return { props: { error: response.error } }
}

export default function JoinCodePage({error}: {error: string}) {
    return null
}