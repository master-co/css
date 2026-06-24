import Demo from '~/internal/components/Demo'

export default () => <>
    <Demo>
        <button className='btn btn-md touch-yellow yellow' popoverTarget="my-popover">Open Popover</button>
        <div id="my-popover" popover="auto" className="b:1px|solid|line p:xl r:xl transition:transform|slow|smooth bg:surface max-w:90vw bg:black/.3::backdrop transform:scale(0)@starting-style">
            <div className='text-center text:xl font:medium'>@starting-style</div>
            <div className='text:sm mt:md'>Hello! I&apos;m a popover with zoom-in effect ✨</div>
            <button className='accent btn btn-md touch-yellow mt:lg w:full' popoverTarget="my-popover" popoverTargetAction="hide">Close</button>
        </div>
    </Demo>
</>
