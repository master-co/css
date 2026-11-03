import { useState } from 'react';
import Code from './Code';
import Demo from './Demo';

const DocHTMLDemoCode = (props: any) => {
    const { children, defaultValue, max, min } = props
    let [html, setHtml] = useState<string>(typeof children === 'string' ? children : children(defaultValue))
    return (
        <>
            {defaultValue && <input type="range" className="inputSlider w:full mb:10 mt:-3 block"
                defaultValue={defaultValue} max={max} min={min}
                onInput={({ target }: any) => setHtml(children(target.value))} />}
            <Demo html={html.replace(/\.\.\./g, '')} />
            <Code lang="html">{html.replace(/\.\.\.(.*)\.\.\./gs, '...')}</Code>
        </>
    )
};

export default DocHTMLDemoCode;