import Play, { PlayShare } from '../Play'
import { notFound } from 'next/navigation'
import { collectDictionary } from 'websites/dictionaries'
import firebaseConfig from 'websites/firebase-config'
import { initializeApp } from '@firebase/app'
import { getFirestore, doc, getDoc } from '@firebase/firestore/lite'
import docMenuDict from '~/data/docMenuDict'
import metadata from '../metadata'
import { generate } from '~/utils/metadata'
import dayjs from 'dayjs'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(props: any, parent: any) {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    const { shareId } = props.params
    const shareItemRef = doc(db, `sandbox/${shareId}`)
    const data = await getDoc(shareItemRef)
    let shareItem
    if (data.exists()) {
        shareItem = data.data() as PlayShare
    }
    const dateTime = dayjs(shareItem?.createdAt)
    return generate({
        ...metadata,
        openGraph: {
            title: `Play #${props.params.shareId}`,
            description: shareItem?.createdAt ? `${dateTime.format('MMMM D YYYY')}, at ${dateTime.format('hh:mm:ss A')}` : metadata.description
        },
        category: `v${shareItem?.version}`,
    }, props, parent)
}

export default async function Page(props: any) {
    const app = initializeApp(firebaseConfig)
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
            <Play shareItem={shareItem} shareId={shareId} locale={locale} dict={await collectDictionary(locale, [
                ...docMenuDict,
                'Sharing ...',
                'Share'
            ])}
            />
        )
    } else {
        notFound()
    }
}