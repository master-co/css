export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
    return (
        <div className='abs flex full items-center justify-center py:xl py:2xl@sm'>
            <button className="btn btn-md touch-yellow yellow btn-sm@<2xs">Submit</button>
        </div>
    )
}
