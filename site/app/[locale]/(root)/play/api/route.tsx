import app from 'shared/firebase-admin-app'
import { initializeFirestore } from 'firebase-admin/firestore'
const store = initializeFirestore(app)
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const { id, data } = await req.json()
    const docRef = store.doc(`sandbox/${id}`)
    if (data) {
        try {
            const result = await docRef.create(data)
            return NextResponse.json(result)
        } catch (e) {
            console.error(e)
            return NextResponse.error()
        }
    } else {
        return NextResponse.json('Invalid Parameter Value', { status: 400 })
    }
}

