import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = false

export default async function Page() {
    notFound()
}
