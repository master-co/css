/* eslint-disable @next/next/no-html-link-for-pages */
export default function FormValidationAndStatesExample() {
    return (
        <>
            <div className="font:14 font:medium">Email</div>
            <input type="email" defaultValue={'aron@master.'} className="{border:red;outline:red!}**:invalid** outline:1|solid:focus b:1|solid|fade-88 ..{border:red-30;outline:red-30!}**:invalid**@dark h:48 px:16 b:gray-28@dark bg:white bg:gray-22@dark r:5 mt:5 w:full.."/>
            <div className="font:14 font:medium mt:20">Password</div>
            <input className="opacity:.5**:disabled** ..b:1|solid|fade-88 h:48 px:16 b:gray-28@dark bg:white bg:gray-22@dark r:5 mt:5 w:full.." disabled type="password" defaultValue={'1234567890'} autoComplete="off" />
        </>
    )
}