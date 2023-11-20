import Play, { PlayShare } from '../Play'
import { notFound } from 'next/navigation'
import { collectDictionary } from 'websites/dictionaries'
import firebaseConfig from 'websites/firebase-config'
import { initializeApp } from '@firebase/app'
import { getFirestore, doc, getDoc } from '@firebase/firestore/lite'
import docMenuDict from '~/components/docMenuDict'

export const dynamic = 'force-static'
export const revalidate = false

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