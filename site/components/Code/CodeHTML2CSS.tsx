import { render } from '@master/css/render';
import { useMemo } from 'react';
import CodeTabs from './CodeTabs';
import clearCodeTokens from '~/utils/clearCodeTokens';
import { beautifyCss } from '~/utils/beautifyCss';
import { CloneStyleSheet } from '~/utils/clone-style-sheet';

const CodeHTML2CSS = ({ children: html }: any) => {
    const generatedCSS = useMemo(() => {
        return beautifyCss(`
            /* Automatically generated CSS */
            ${render(clearCodeTokens(html), { StyleSheet: CloneStyleSheet }).css}
        `)
    }, [html])
    return (
        <CodeTabs>{[
            {
                name: 'HTML', lang: 'html', hideName: true, hideClose: true,
                code: html
            },
            {
                name: 'CSS', lang: 'css', hideName: true, hideClose: true,
                code: generatedCSS
            }
        ]}</CodeTabs>
    )
}

export default CodeHTML2CSS
