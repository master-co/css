import Play, { PlayShare } from '../Play'
import app from 'shared/firebase-admin-app'
import { initializeFirestore } from 'firebase-admin/firestore'
const store = initializeFirestore(app)
import { notFound } from "next/navigation"
import { collectDictionary } from 'shared/dictionaries'

export default async function Page(props: any) {
    const shareId = props.params.shareId
    const locale = props.params.locale
    if (!shareId) {
        notFound()
    }
    let shareItem: PlayShare | null = null
    const shareItemRef = store.doc(`sandbox/${shareId}`)
    const doc = await shareItemRef.get()
    if (doc.exists) {
        shareItem = doc.data() as PlayShare
        return (
            <Play shareItem={shareItem}
                shareId={shareId}
                locale={locale}
                dict={await collectDictionary(locale, ['Docs', 'Play', 'Updates', 'Components', 'Sharing ...', 'Share'])}
            />
        )
    } else {
        notFound()
    }
}