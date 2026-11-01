import Demo from '~/site/components/demo/Demo'

export default () => <>
  <Demo>
    <button type="button" className="ui-button" data-variant="primary" popoverTarget="my-popover">Open Popover</button>
    <div id="my-popover" popover="auto" className="(max-width:90vw) p-xl b-solid b(1) b-line-divider r-xl bg-surface-raised (transition-duration:var(--duration-slow)) (transition-property:transform) (transition-timing-function:var(--easing-smooth)) bg-black/.3::backdrop (transform:scale(0))@starting-style">
      <div className='text-xl font-medium text-center'>@starting-style</div>
      <div className='mt-md text-sm'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
      <button type="button" className='w-full mt-lg ui-button' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
    </div>
  </Demo>
</>
