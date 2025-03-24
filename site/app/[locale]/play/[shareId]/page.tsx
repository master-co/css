import Play, { PlayShare } from '../Play'
import { notFound } from 'next/navigation'
import firebaseConfig from 'internal/common/firebase.config'
import { initializeApp } from '@firebase/app'
import { getFirestore, doc, getDoc } from '@firebase/firestore/lite'
import metadata from '../metadata'
import generate from 'internal/utils/generate-metadata'
import dayjs from 'dayjs'
import AvoidFOUCScript from '~/internal/components/AvoidFOUCScript'

export const dynamic = 'force-static'
export const revalidate = false
const app = initializeApp(firebaseConfig)

export async function generateMetadata(props: any, parent: any) {
    const db = getFirestore(app)
    const { shareId } = await props.params
    const shareItemRef = doc(db, `sandbox/${shareId}`)
    const data = await getDoc(shareItemRef)
    let shareItem
    if (data.exists()) {
        shareItem = data.data() as PlayShare
    }
    const dateTime = dayjs(shareItem?.createdAt)
    return await generate({
        ...metadata,
        openGraph: {
            title: `Play #${shareId}`,
            description: shareItem?.createdAt ? `${dateTime.format('MMMM D YYYY')}, at ${dateTime.format('hh:mm:ss A')}` : metadata.description
        },
        category: `v${shareItem?.version}`,
    }, props, parent)
}

export default async function Page(props: any) {
    const db = getFirestore(app)
    const { shareId, locale } = props.params
    if (!shareId) {
        notFound()
    }
    let shareItem: PlayShare | null = null
    const shareItemRef = doc(db, `sandbox/${shareId}`)
    const data = await getDoc(shareItemRef)
    if (data.exists()) {
        shareItem = data.data() as PlayShare
        return (
            <>
                <AvoidFOUCScript />
                <Play shareItem={shareItem} shareId={shareId} />
            </>
        )
    } else {
        notFound()
    }
}