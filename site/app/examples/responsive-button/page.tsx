import '~/site/styles/btn.css'
import '~/site/styles/btn-yellow.css'
export const dynamic = 'force-static'
export const revalidate = false

export default function Page() {
  return (
    <div className='position:absolute display:flex align-items:center justify-content:center full py-xl py-2xl@sm'>
      <button className="btn btn-md btn-responsive touch-yellow yellow">Submit</button>
    </div>
  )
}
