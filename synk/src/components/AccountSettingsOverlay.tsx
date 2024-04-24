import styles from './AccountSettingsOverlay.module.css'
import { Inter } from 'next/font/google'
import UploadIcon from '@/icons/upload.svg'
import useTranslation from '@/other/useTranslation'
import { DetailedHTMLProps, DragEventHandler, InputHTMLAttributes, MutableRefObject, useRef, useState } from 'react'
import useRequest from '@/other/useRequest'
import useCookies from '@/other/useCookies'
const inter = Inter({ subsets: ['latin'] })

export default function AccountSettingsOverlay({ disable }: { disable: Function }) {
    const { makeRequest, loading } = useRequest()
    const { getAuthObject } = useCookies()
    const fileInputRef = useRef() as MutableRefObject<HTMLInputElement>
    const { getTranslation } = useTranslation()
    const [dragOverActive, setdragOverActive] = useState(false)
    const [uploading, setuploading] = useState(false)

    function handleFileDrop(event: any) {
        if (uploading || event.dataTransfer.files.length == 0) {
            return
        }
        event.preventDefault()
        handleFileUpload(event.dataTransfer.files[0])
    }

    function handleFileSelect(event: any) {
        if (uploading || event.target.files.length == 0) {
            return
        }
        handleFileUpload(event.target.files[0])
    }

    async function handleFileUpload(file: File) {
        setdragOverActive(false)
        setuploading(true)
        const result = await makeRequest("/updateProfilePicture", {
            image: await getBase64(file),
            ...getAuthObject()
        })
        if(!result.error){
            disable()
            location.reload()
        }
        setuploading(false)
    }

    function getBase64(file: File) {
        return new Promise((resolve) => {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                resolve(reader.result)
            };
            reader.onerror = function (error) {
                console.log('Error: ', error);
            };
        })
    }

    function handleClick() {
        if (uploading) {
            return
        }
        fileInputRef.current.click()
    }

    return (
        <div onClick={
            (e) => {
                if (e.target === e.currentTarget)
                    disable()
            }
        } className={styles.body}>
            <div className={styles.box}>
                <p className={`${inter.className} ${styles.title}`}>Account Settings</p>
                <div onClick={handleClick} draggable={true} onDragOver={(e) => { e.preventDefault() }} onDrop={handleFileDrop} onDragEnter={() => { setdragOverActive(true) }} onDragLeave={() => { setdragOverActive(false) }} className={`${styles.filedroparea} ${dragOverActive ? styles.filedropareaactive : ""}`}>
                    <div className={styles.uploadicon} style={{ backgroundImage: `url(${UploadIcon.src})` }} />
                    {!uploading && <p className={`${inter.className} ${styles.fileuploadtext}`}>{getTranslation("profile.dragfile")}</p>}
                    {(uploading || loading) && <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill='white' d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite" /></path></svg>}
                </div>
                <input style={{ display: "none" }} onChange={handleFileSelect} type='file' accept="image/jpeg, image/png" ref={fileInputRef} />
            </div>
        </div>
    )
}