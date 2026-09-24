import clsx from 'clsx'
import BrowserHeader from './BrowserHeader'
import Demo from './Demo'

export default function IFrame(props: any) {
  let { showHeader = true, scrolling = 'no' } = props
  return (
    <Demo $py={0} $px={0} className="w:100%">
      {showHeader && <BrowserHeader url={props.src} />}
      <iframe {...props} title='iframe' className={clsx(props.className, 'background-color:transparent')} scrolling={scrolling} width={props.width || '100%'} height={props.height} />
    </Demo>
  )
}