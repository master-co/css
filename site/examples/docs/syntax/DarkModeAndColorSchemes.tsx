/* eslint-disable @next/next/no-html-link-for-pages */

export default function DarkModeAndColorSchemesExample() {
    return (
        <div className="bg:gray-22**@dark** bg:white flex flex:col@<xs max-w:480 r:10 mx:auto overflow:hidden shadow:demo">
            <img className="order:1**@dark** object:cover w:144@xs" src="/images/mountain.jpg" />
            <div className="p:25">
                <div className="font:fade-30**@light** text:20 font:bold">Mountain</div>
                <div className="font:gray-60**@dark** font:fade text:14 lines:3 mt:8">A mountain is an elevated portion of the Earth&#39;s crust, generally with steep sides that show significant exposed bedrock.</div>
            </div>
        </div>
    )
}