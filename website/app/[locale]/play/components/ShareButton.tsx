'use client'

import firebaseConfig from 'websites/firebase-config'
import { initializeApp } from '@firebase/app'
import { getFirestore, setDoc, doc } from '@firebase/firestore/lite'
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 14)
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const ShareButton = ({ children, onClick, ...props }: any) => {
    return (
        <button {...props} onClick={() => {
            onClick(async (databaseShareItem: any) => {
                const newShareId = nanoid()
                const docRef = doc(db, 'sandbox', newShareId)
                // 將資料寫入集合並取得寫入後的 ID
                try {
                    await setDoc(docRef, databaseShareItem)
                } catch (error) {
                    console.error('Error adding document: ', error)
                }
                return newShareId
            })
        }} >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1" className="fill:dim/.2"></path>
                <path d="M12 14v-11"></path>
                <path d="M9 6l3 -3l3 3"></path>
            </svg>
            {children}
        </button>
    )
}

export default ShareButton