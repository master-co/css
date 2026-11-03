/* eslint-disable @next/next/no-html-link-for-pages */

export default function StyleAllDescendantsAtOnceExample() {
    return (
        <article className="font:30**_**h1 font:18!**_**:where(p) text-decoration-color:indigo!**_**u mb:0**_**p:last ..mt:0_h1 mb:0_blockquote bg:white bg:gray-22@dark w:full max-w:600@sm p:40 shadow:demo..">
            <h1>Style all descendants at once</h1>
            <p>Heavy boxes <u>perform</u> quick waltzes and jigs. Heavy boxes <u>perform</u> quick waltzes and jigs.</p>
            <blockquote>
                <p>Heavy boxes perform quick waltzes and jigs. Heavy boxes perform quick waltzes and jigs.</p>
            </blockquote>
            <p>Heavy boxes perform quick waltzes and jigs. Heavy boxes perform quick waltzes and jigs.</p>
        </article>
    )
}