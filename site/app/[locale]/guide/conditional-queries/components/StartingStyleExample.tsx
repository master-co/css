import Demo from '~/internal/components/Demo'

export default () => <>
    <Demo>
        <button className='btn btn-md accent touch-accent' popoverTarget="my-popover">Open Popover</button>
        <div id="my-popover" popover="auto" className="transition:transform|slow|smooth b:1|line p:xl r:xl bg:surface max-w:90vw bg:black/.3::backdrop scale(0)@starting-style">
            <div className='text:xl font:medium text:center'>@starting-style</div>
            <div className='text:sm mt:md'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
            <button className='btn btn-md accent mt:lg w:full touch-accent' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
        </div>
    </Demo>
</>
