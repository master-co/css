const ExpressiveStyles = () => {
    return (
        <>
            <div className="flex@xs translateY(-5):hover ~transform|.2s overflow:hidden bg:white bg:gray-22@dark r:10 shadow:demo">
                <img className="object:cover w:144@xs" src="/images/mountain.jpg" />
                <div className="p:25">
                    <div className="font:bold font:fade-30@light text:20">Mountain</div>
                    <div className="font:fade font:gray-60@dark text:14 lines:3 mt:8">A mountain is an elevated portion of the Earth&#39;s crust, generally with steep sides that show significant exposed bedrock.</div>
                </div>
            </div>
        </>
    )
};

export default ExpressiveStyles;