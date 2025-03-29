import Demo from '~/internal/components/Demo'

export default () => <>
    <Demo>
        <button className='btn btn-md yellow touch-yellow' popoverTarget="my-popover">Open Popover</button>
        <div id="my-popover" popover="auto" className="~transform|.3s b:1|frame-light bg:surface bg:black/.3::backdrop max-w:90vw p:8x r:3x scale(0)@starting-style">
            <div className='font:semibold text:20 text:center'>@starting-style</div>
            <div className='mt:4x text:14'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
            <button className='btn btn-md yellow touch-yellow mt:6x w:full' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
        </div>
    </Demo>
</>