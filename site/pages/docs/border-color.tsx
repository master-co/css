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

export default function BorderColor() {
    const colors = Style.colors

    return (
        <>
            <ClassTable names={[
                ['border-color:`color`', 'border:`color`', 'b:`color`'],
                ['border-top:`color`', 'bt:`color`'],
                ['border-bottom:`color`', 'bb:`color`'],
                ['border-left:`color`', 'bl:`color`'],
                ['border-right:`color`', 'br:`color`'],
                ['bx:`color`'],
                ['by:`color`']
            ]}>
            </ClassTable>
            <p className="hint">
                Use or name colors please refer to <ALink href="/docs/colors"><code>Colors</code></ALink>.
                Also supports color like <code>#hex</code>, <code>rgb(…)</code>, <code>hsl(…)</code>.
            </p>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>border-color</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the color of an element&rsquo;s border.
            </p>
            <h3 id="colors">Colors</h3>
            <p>
                Use <code>color</code> please refer to <a href="colors" target="blank">Colors</a>.
            </p>
            <BoxList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => `b:${colorName}-60`)}
                renderClasses="bg:fade-80/.2! bg:gray-40/.2!@dark b:3">
            </BoxList>
            <h3 id="hex">Hex</h3>
            <BoxList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => `b:#${colors[colorName][60]}`)}
                renderClasses="bg:fade-80/.2! bg:gray-40/.2!@dark b:3">
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
                            return `b:rgb(${rgb?.r},${rgb?.g},${rgb?.b})`
                        })
                }
                renderClasses="bg:fade-80/.2! bg:gray-40/.2!@dark b:3">
            </BoxList>
            <StyleFunctions name="border-color:$(color)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="border-color:blue-60:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="border-color:blue-60@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="border-color:blue-60@print"></StyleMediaQueries>
            <StyleColorSchemes name="border-color:blue-60@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.border-color'

BorderColor.page = {
    layout: CssDoc,
    title: 'Border Color',
    description: 'The border-color CSS property sets the color of an element’s border.',
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
