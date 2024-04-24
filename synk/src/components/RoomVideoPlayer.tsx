import videojs from 'video.js'
import 'video.js/dist/video-js.css';
import styles from './RoomVideoPlayer.module.css'
import { useEffect, useRef, useState } from 'react';
import Player from 'video.js/dist/types/player';
import useGlobalContext from '@/other/useGlobalContext';

export default function RoomVideoPlayer({ roomdata, forceUpdateCallback }: { roomdata: roomdata | undefined, forceUpdateCallback: Function }) {
    const { useSocketInstance: { socket, clientserverdelta }, globalInitialData } = useGlobalContext()
    const lastPlayObject = useRef<lastplayobject>();
    const videoRef = useRef(null);
    const playerRef = useRef<Player | null>(null);
    const [intialDataSet, setintialDataSet] = useState(false)

    useEffect(() => {
        if (!roomdata || intialDataSet) {
            return
        }
        setintialDataSet(true)
        if (roomdata.current_video_progress == null) {
            return
        }
        /*processPlayData({
            playing: roomdata.current_video_playing,
            progress: parseFloat(roomdata.current_video_progress),
            progressTime: parseFloat(roomdata.current_video_progress_time)
        })*/
    }, [roomdata, intialDataSet])


    useEffect(() => {
        if (!socket) {
            return
        }
        socket.on("roommessage", messageReceived)
        return () => {
            socket.off("roommessage", messageReceived)
        }
    }, [socket])

    function messageReceived(unparsedJson: string) {
        console.log("RECEIVED MESSAGE FOR ROOM")
        const json = JSON.parse(unparsedJson)
        if (json.type == "video_play") {
            processPlayData(json)
        }
        if (json.type == "newurl") {
            console.log(json.url)
            playerRef.current?.src(json.url)
        }
    }

    function processPlayData(json: lastplayobject) {
        lastPlayObject.current = json
        let player = playerRef.current
        console.log(json)
        if (json.playing) {
            player?.currentTime(getCurrentVideoProgress(json) + 0.1)
            setTimeout(() => {
                player?.play()
            }, 100);
        } else {
            player?.currentTime(json.progress / 1000)
            player?.pause()
        }
    }

    function forceUpdate(data: roomdata) {
        processPlayData({
            playing: data.current_video_playing,
            progress: parseFloat(data.current_video_progress),
            progressTime: parseFloat(data.current_video_progress_time)
        })
    }

    useEffect(() => {
        forceUpdateCallback(forceUpdate)
        if (!videoRef.current || !socket || !roomdata || clientserverdelta == undefined) {
            return
        }
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode. 
            const videoElement = document.createElement("video-js");

            videoElement.classList.add(styles.videojs);
            videoElement.classList.add('vjs-16-9');
            (videoRef.current as any).appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: false,
                controls: true,
                responsive: true,
                loop: false,
                preload: "auto",
                muted: true,
                sources: [{
                    src: roomdata.current_url,
                    type: 'video/mp4'
                }]
            })
            playerRef.current = player
            processPlayData({
                playing: roomdata.current_video_playing,
                progress: parseFloat(roomdata.current_video_progress),
                progressTime: parseFloat(roomdata.current_video_progress_time)
            })

            player.on("play", () => {
                console.log("playing")
                if (!lastPlayObject?.current?.playing) {
                    socket.emit("playvideo", true, (playerRef.current as Player).currentTime())
                }
            })

            player.on("pause", () => {
                console.log("pausing")
                if (lastPlayObject?.current?.playing) {
                    socket.emit("playvideo", false, (playerRef.current as Player).currentTime())
                }
            })
        }
    }, [videoRef, socket, roomdata, clientserverdelta])

    function getCurrentVideoProgress(json: any) {
        console.log(json)
        let progresstime = json.progressTime
        let currenttime = Date.now()
        let servertime = currenttime
        if (clientserverdelta) {
            servertime += clientserverdelta
        }
        let timepassedsinceprogress = servertime - progresstime
        let realprogress = ((json.progress + timepassedsinceprogress) / 1000)
        console.log(realprogress)
        return realprogress
    }

    return (
        <div data-vjs-player className={styles.videocontainer}>
            <div ref={videoRef} />
        </div>
    )
}