export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
    return (
        <div className='abs center-content flex full py:8x py:12x@sm'>
            <button className="btn btn-md yellow touch-yellow btn-sm@<2xs">Submit</button>
        </div>
    )
}