import '~/site/styles/btn.css'
import '~/site/styles/btn-yellow.css'
import Demo from '~/site/docs-shell/components/Demo'

export default () => <>
  <Demo>
    <button className='btn btn-md yellow touch-yellow' popoverTarget="my-popover">Open Popover</button>
    <div id="my-popover" popover="auto" className="max-w:90vw p-xl b:1px|solid|var(--color-line-base) r-xl surface-raised transition:transform|var(--duration-slow)|var(--easing-smooth) bg-black/.3::backdrop transform:scale(0)@starting-style">
      <div className='text-xl font-medium text-center'>@starting-style</div>
      <div className='mt-md text-sm'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
      <button className='btn btn-md accent touch-yellow w:100% mt-lg' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
    </div>
  </Demo>
</>
