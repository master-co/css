/* eslint-disable @next/next/no-html-link-for-pages */
export default function PlaceholderAndSelectionExample() {
    return (
        <>
            <input className="font:fade-60**::placeholder** font:gray-40**::placeholder**@dark b:1|solid|fade-88 bg:white r:5 mt:5 w:full h:48 px:16 b:gray-28@dark bg:gray-22@dark" type="email" placeholder="Enter your email" />
            <div className="bg:red**::selection** font:white**::selection** font:fade-40 font:gray-70@dark font:12 mt:10">Enter the correct Email, the verification code will be sent here.</div>
        </>
    )
}