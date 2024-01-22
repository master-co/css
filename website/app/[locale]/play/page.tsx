import Play from './Play'

export const dynamic = 'force-static'
export const revalidate = false

export default async function Page(props: any) {
    return (
        <Play />
    )
}