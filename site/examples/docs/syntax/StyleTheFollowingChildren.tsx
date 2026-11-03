/* eslint-disable @next/next/no-html-link-for-pages */

export default function StyleTheFollowingChildrenExample() {
    return (
        <ul className="font:crimson-60!**>**li**>**p font:heavy ..font:crimson-60!>li>p@dark bg:white bg:gray-22@dark w:full max-w:340@sm p:25|50 shadow:demo my:0..">
            <li>
                <p>L1</p>
                <ul>
                    <li> <p>L2</p> </li>
                    <li> <p>L2</p> </li>
                </ul>
            </li>
            <li> <p>L1</p> </li>
        </ul>
    )
}