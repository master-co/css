import { Style } from '@master/css'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Link from 'next/link'
import ALink from '~/components/ALink'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function OutlineColor() {
    const colors = Style.colors

    return (
        <>
            <ClassTable names={[
                ['outline-color:`color`', 'outline:`color`'],
                ['outline:#`hex`'],
                ['outline:rgb(`rgb`)'],
                ['outline:hsl(`hsl`)'],
            ]}>
            </ClassTable>
            <p className="hint">
                Use or name colors please refer to <ALink href="/docs/colors"><code>Colors</code></ALink>.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>outline-color</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the color of an element&rsquo;s outline.
            </p>
            <h3 id="colors">Colors</h3>
            <p>
                Use <code>color</code> please refer to <a href="colors" target="blank">Colors</a>.
            </p>
            <BoxList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => `outline:${colorName}-60`)}
                renderClasses="bg:fade-80/.2! bg:gray-40/.2!@dark outline:3|solid mt:5">
            </BoxList>
            <h3 id="hex">Hex</h3>
            <BoxList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => `outline:#${colors[colorName][60]}`)}
                renderClasses="bg:fade-80/.2! bg:gray-40/.2!@dark outline:3|solid mt:5">
            </BoxList>
            <h3 id="rgb">RGB</h3>
            <BoxList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => {
                            const hexToRgb = (hex: string) => {
                                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                                return result && { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
                            };
                            const eachColor = colors[colorName];
                            const hex = '#' + eachColor[60];
                            const rgb = hexToRgb(hex)
                            return `outline:rgb(${rgb?.r},${rgb?.g},${rgb?.b})`
                        })
                }
                renderClasses="bg:fade-80/.2! bg:gray-40/.2!@dark outline:3|solid mt:5">
            </BoxList>
            <StyleFunctions name="outline-color:$(color)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="outline-color:blue-60:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="outline-color:blue-60@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="outline-color:blue-60@print"></StyleMediaQueries>
            <StyleColorSchemes name="outline-color:blue-60@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.outline-color'

OutlineColor.page = {
    layout: CssDoc,
    title: 'Outline Color',
    description: 'The outline-color CSS property sets the color of an element’s outline.',
    editors: ['Aron', 'Lola'],
    localeNamespace,
    mdn: true,
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};

