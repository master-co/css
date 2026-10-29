import '~/site/styles/btn.css'
import '~/site/styles/btn-yellow.css'
import Demo from '~/site/components/demo/Demo'

export default () => <>
  <Demo>
    <button className='btn btn-md touch-yellow yellow' popoverTarget="my-popover">Open Popover</button>
    <div id="my-popover" popover="auto" className="max-width:90vw p-xl b-line-divider r-xl border-style:solid border-width:1px bg-surface-raised transition-duration:var(--duration-slow) transition-property:transform transition-timing-function:var(--easing-smooth) bg-black/.3::backdrop transform:scale(0)@starting-style">
      <div className='text-xl font-medium text-align:center'>@starting-style</div>
      <div className='mt-md text-sm'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
      <button className='width:100% mt-lg accent btn btn-md touch-yellow' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
    </div>
  </Demo>
</>
