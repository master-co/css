import { useState } from 'react'
import Code from '~/components/Code'
import { markCodeWithPattern } from '~/utils/markCodeWithPattern';
import StylesHomeTab from '~/components/StylesHomeTab';
import StylesHomeTabs from '~/components/StylesHomeTabs';

import AnimationSvg from '~/svgs/animation.svg'
import TransitionSvg from '~/svgs/transition.svg'
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';

const defaultPattern = '@ping|1s|infinite|@flash|1s|infinite|@fade|1s|infinite|@heart|1s|infinite|@jump|1s|infinite|@pulse|1s|infinite|@rotate|1s|infinite|@shake|1s|infinite|@zoom|1s|infinite|@float|3s|ease-in-out|infinite|~color|.3s>svg';

const GiveItLifeSection = () => {
    const [code, setCode] = useState(markCodeWithPattern(originCode, defaultPattern))
    const markCode = (pattern: string) => {
        setCode(markCodeWithPattern(originCode, pattern))
    }
    return (
        <section className="p:50|10|0|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer grid-cols:1 grid-cols:9@md gap:30|0 gap:80@sm">
                <div className="grid-col-span:4 flex align-items:start justify-content:center" dangerouslySetInnerHTML={{ __html: originCode }}></div>
                <div className="grid-col-span:5">
                    <h5 className="homeSubtitle f:blue-70">Animation & Transition</h5>
                    <h2 className="homeTitle">Static ? It&#39;s time to give it life.</h2>
                    <p>
                        We&#39;ve provide associative symbols like <code>@</code> animation and <code>~</code> transition to make the code succinct.
                        Specify <code>duration</code>, <code>delay</code>, etc. directly on the class without pre-definition.
                    </p>
                    <StylesHomeLearnMore href="/docs/animation">Learn more about Animation</StylesHomeLearnMore>
                    {/* <StylesHomeTabs defaultName="Animation">
                        <StylesHomeTab Icon={AnimationSvg} onChange={() => markCode(defaultPattern)} active>Animation</StylesHomeTab>
                        <StylesHomeTab Icon={TransitionSvg} onChange={() => markCode('~color|.3s>svg')}>Transition</StylesHomeTab>
                    </StylesHomeTabs> */}
                    <div className="mt:20 mx:-20@<md">
                        <Code lang="html" className="max-h:350 bb:0@<sm rb:0@<sm" lineNumbers>{code}</Code>
                    </div>
                </div>
            </div>
        </section >
    )
}

const originCode = /* html */ `
    <div class="~color|.3s>svg fill:white>svg:hover grid-cols:4 grid-cols:3@sm gap:40 gap:80@sm px:80@sm w:full fill:blue-70>svg">
        <svg class="@ping|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" opacity=".2"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        <svg class="@flash|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M13 3.06V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06c-.46-4.17-3.77-7.48-7.94-7.94zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/><circle cx="12" cy="12" opacity=".2" r="2"/><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
        <svg class="@fade|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M4.94 7.26l2.21 2.21c1.44-.91 3.11-1.4 4.85-1.4 1.74 0 3.41.49 4.84 1.4l2.21-2.21C17 5.79 14.56 5 12 5c-2.56 0-5.01.79-7.06 2.26z" opacity=".2"/><circle cx="12" cy="17" opacity=".2" r="3"/><path d="M17 17c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zm-8 0c0-1.65 1.35-3 3-3s3 1.35 3 3-1.35 3-3 3-3-1.35-3-3zM2 7.15l5 5c1.28-1.28 3.05-2.08 5-2.08s3.72.79 5 2.07l5-5C19.44 4.59 15.9 3 12 3 8.1 3 4.56 4.59 2 7.15zm14.84 2.32c-1.44-.91-3.1-1.4-4.84-1.4-1.74 0-3.41.49-4.85 1.41L4.94 7.26C6.99 5.79 9.44 5 12 5c2.56 0 5 .79 7.05 2.26l-2.21 2.21z"/></svg>
        <svg class="@heart|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16.5 5c-1.54 0-3.04.99-3.56 2.36h-1.87C10.54 5.99 9.04 5 7.5 5 5.5 5 4 6.5 4 8.5c0 2.89 3.14 5.74 7.9 10.05l.1.1.1-.1C16.86 14.24 20 11.39 20 8.5c0-2-1.5-3.5-3.5-3.5z" opacity=".2"/><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
        <svg class="@jump|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" opacity=".2"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        <svg class="@pulse|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M15.11,12.45L14,10.24l-3.11,6.21C10.72,16.79,10.38,17,10,17s-0.72-0.21-0.89-0.55L7.38,13H2v2h2v3h16v-3 h2v-2h-6C15.62,13,15.28,12.79,15.11,12.45z" opacity=".2"/><path d="M20,6H4v3H2v2h6c0.38,0,0.72,0.21,0.89,0.55L10,13.76l3.11-6.21c0.34-0.68,1.45-0.68,1.79,0L16.62,11H22V9 h-2V6z" opacity=".2"/><path d="M20,4H4C2.9,4,2,4.9,2,6v3h2V6h16v3h2V6C22,4.9,21.1,4,20,4z"/><path d="M20,18H4v-3H2v3c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-3h-2V18z"/><path d="M14.89,7.55c-0.34-0.68-1.45-0.68-1.79,0L10,13.76l-1.11-2.21C8.72,11.21,8.38,11,8,11H2v2h5.38l1.72,3.45 C9.28,16.79,9.62,17,10,17s0.72-0.21,0.89-0.55L14,10.24l1.11,2.21C15.28,12.79,15.62,13,16,13h6v-2h-5.38L14.89,7.55z"/></g></g></svg>
        <svg class="@rotate|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10.9 19.91c.36.05.72.09 1.1.09 2.18 0 4.16-.88 5.61-2.3L14.89 13l-3.99 6.91zm-1.04-.21l2.71-4.7H4.59c.93 2.28 2.87 4.03 5.27 4.7zM8.54 12L5.7 7.09C4.64 8.45 4 10.15 4 12c0 .69.1 1.36.26 2h5.43l-1.15-2zm9.76 4.91C19.36 15.55 20 13.85 20 12c0-.69-.1-1.36-.26-2h-5.43l3.99 6.91zM13.73 9h5.68c-.93-2.28-2.88-4.04-5.28-4.7L11.42 9h2.31zm-3.46 0l2.83-4.92C12.74 4.03 12.37 4 12 4c-2.18 0-4.16.88-5.6 2.3L9.12 11l1.15-2z" opacity=".2"/><path d="M12 22c5.52 0 10-4.48 10-10 0-4.75-3.31-8.72-7.75-9.74l-.08-.04-.01.02C13.46 2.09 12.74 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10zm0-2c-.38 0-.74-.04-1.1-.09L14.89 13l2.72 4.7C16.16 19.12 14.18 20 12 20zm8-8c0 1.85-.64 3.55-1.7 4.91l-4-6.91h5.43c.17.64.27 1.31.27 2zm-.59-3h-7.99l2.71-4.7c2.4.66 4.35 2.42 5.28 4.7zM12 4c.37 0 .74.03 1.1.08L10.27 9l-1.15 2L6.4 6.3C7.84 4.88 9.82 4 12 4zm-8 8c0-1.85.64-3.55 1.7-4.91L8.54 12l1.15 2H4.26C4.1 13.36 4 12.69 4 12zm6.27 3h2.3l-2.71 4.7c-2.4-.67-4.35-2.42-5.28-4.7h5.69z"/></svg>
        <svg class="@shake|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 6.5c-2.49 0-4 2.02-4 4.5v6h8v-6c0-2.48-1.51-4.5-4-4.5z" opacity=".2"/><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-2 6H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6zM7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42z"/></svg>
        <svg class="@zoom|1s|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" opacity=".2"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        <svg class="@float|3s|ease-in-out|infinite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M0 0h24v24H0z" fill="none"/><path d="M8.5 14.5L4 19l1.5 1.5L9 17h2l-2.5-2.5zM15 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 20.01L18 24l-2.99-3.01V19.5l-7.1-7.09c-.31.05-.61.07-.91.07v-2.16c1.66.03 3.61-.87 4.67-2.04l1.4-1.55c.19-.21.43-.38.69-.5.29-.14.62-.23.96-.23h.03C15.99 6.01 17 7.02 17 8.26v5.75c0 .84-.35 1.61-.92 2.16l-3.58-3.58v-2.27c-.63.52-1.43 1.02-2.29 1.39L16.5 18H18l3 3.01z"/></svg>
    </div>
`

export default GiveItLifeSection