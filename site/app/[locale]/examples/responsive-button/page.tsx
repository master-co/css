export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
    return (
        <div className='abs flex full items-center justify-center py:8x py:12x@sm'>
            <button className="btn btn-md yellow touch-yellow btn-sm@<2xs">Submit</button>
        </div>
    )
}