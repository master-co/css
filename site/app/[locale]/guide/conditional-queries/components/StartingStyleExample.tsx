import '~/site/styles/btn.css'
import '~/site/styles/btn-yellow.css'
import Demo from '~/site/docs-shell/components/Demo'

export default () => <>
  <Demo>
    <button className='btn btn-md touch-yellow yellow' popoverTarget="my-popover">Open Popover</button>
    <div id="my-popover" popover="auto" className="max-width:90vw p-xl r-xl border:1px|solid|var(--color-line-divider) bg-surface-raised transition:transform|var(--duration-slow)|var(--easing-smooth) bg-black/.3::backdrop transform:scale(0)@starting-style">
      <div className='text-xl font-medium text-align:center'>@starting-style</div>
      <div className='mt-md text-sm'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
      <button className='width:100% mt-lg accent btn btn-md touch-yellow' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
    </div>
  </Demo>
</>
