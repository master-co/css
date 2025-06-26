import Demo from '~/internal/components/Demo'

export default () => <>
    <Demo>
        <button className='btn btn-md yellow touch-yellow' popoverTarget="my-popover">Open Popover</button>
        <div id="my-popover" popover="auto" className="~transform|.3s b:1|line-light p:8x r:3x bg:surface max-w:90vw bg:black/.3::backdrop scale(0)@starting-style">
            <div className='text:20 font:medium text:center'>@starting-style</div>
            <div className='text:14 mt:4x'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
            <button className='btn btn-md yellow mt:6x w:full touch-yellow' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
        </div>
    </Demo>
</>