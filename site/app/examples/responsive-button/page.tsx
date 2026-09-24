export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  return (
    <div className='abs flex items-center justify-center full py-xl py-2xl@sm'>
      <button className="btn btn-md yellow touch-yellow btn-sm@media((width<37.5rem))">Submit</button>
    </div>
  )
}
