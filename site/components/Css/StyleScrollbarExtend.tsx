import CodeTabs from "../Code/CodeTabs";

const StyleScrollbarExtend = () => {
    return (
        <>
            <h3 id="beautify-scrollbar">Beautify Scrollbar</h3>
            <p>
                Extend style or copy classes for beautifying <code>scrollbar</code> to your elements.
            </p>
            <CodeTabs>{[
                {
                    name: 'scrollbar.ts', lang: 'ts',
                    code: `
                    import { Style } from '@master/css';

                    Style.extend('classes', {
                        'scrollbar': '
                            {w:5;h:5;rounded}::scrollbar
                            bg:fade-90::scrollbar
                            bg:gray-22::scrollbar@dark
                            bg:transparent::scrollbar-corner
                            bg:fade-88::scrollbar-thumb
                            bg:fade-78::scrollbar-thumb:hover
                            bg:fade-66::scrollbar-thumb:active
                            bg:gray-30::scrollbar-thumb@dark
                            bg:gray-60::scrollbar-thumb:hover@dark
                            bg:gray-60::scrollbar-thumb:active@dark
                            rounded::scrollbar-thumb
                        '
                    })
                `
                },
                {
                    name: 'index.html', lang: 'html',
                    code: `
                        <div class="
                            {w:5;h:5;rounded}::scrollbar
                            bg:fade-90::scrollbar
                            bg:gray-22::scrollbar@dark
                            bg:transparent::scrollbar-corner
                            bg:fade-88::scrollbar-thumb
                            bg:fade-78::scrollbar-thumb:hover
                            bg:fade-66::scrollbar-thumb:active
                            bg:gray-30::scrollbar-thumb@dark
                            bg:gray-60::scrollbar-thumb:hover@dark
                            bg:gray-60::scrollbar-thumb:active@dark
                            rounded::scrollbar-thumb">
                        
                        </div>`
                }
            ]}</CodeTabs>
        </>
    )
};

export default StyleScrollbarExtend;