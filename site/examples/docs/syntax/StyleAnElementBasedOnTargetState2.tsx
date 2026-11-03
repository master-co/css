/* eslint-disable @next/next/no-html-link-for-pages */

export default function StyleAnElementBasedOnTargetStateExample() {
    return (
        <details open className="outline:1|solid|fade-88 bg:white bg:gray-22@dark outline:gray-28@dark max-w:480 r:5 w:full">
            <summary className="**[open]_**{font:20;font:bold} cursor:pointer p:20">
                Why not inline styles?
            </summary>
            <div className="p:0|35|20 mt:-10">
                <p className="font:14 my:0">
                    Inline styles cannot apply selectors, media queries, and many CSS features. With Master CSS, you can now implement them with the most succinct syntax.
                </p>
            </div>
        </details>
    )
}