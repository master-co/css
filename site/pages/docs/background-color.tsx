import { Style } from '@master/css'
import ClassTable from '~/components/Css/ClassTable'
import TextList from '~/components/Css/TextList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackgroundColor() {
    const colors = Style.colors

    return (
        <>
            <ClassTable names={[
                ['background-color:`color`', 'background:`color`', 'bg:`color`'],
                ['bg:#`hex`'],
                ['bg:rgb(`rgb`)'],
                ['bg:hsl(`hsl`)'],
                ['bg:transparent']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>background-color</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the background color of an element.
            </p>
            <h3 id="colors">Colors</h3>
            <p>
                Use <code>color</code> please refer to <a href="colors" target="blank">Colors</a>.
            </p>
            <TextList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => `bg:${colorName}-60`)
                }
                renderClasses="f:50 f:white! r:5 my:15! p:2|5"
            >
            </TextList>
            <h3 id="hex">Hex</h3>
            <TextList
                showClasses={
                    Object.keys(colors)
                        .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                        .map((colorName: string) => `bg:#${colors[colorName][60]}`)
                }
                renderClasses="f:50 f:white! r:5 my:15! p:2|5"
            >
            </TextList>
            <h3 id="rgb">RGB</h3>
            <TextList
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
                            return `bg:rgb(${rgb?.r},${rgb?.g},${rgb?.b})`
                        })
                }
                renderClasses="f:50 f:white! r:5 my:15! p:2|5"
            >
            </TextList>
            <StyleFunctions name="background-color:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="background-color:fade-10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="background-color:fade-10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="background-color:fade-10@print"></StyleMediaQueries>
            <StyleColorSchemes name="background-color:fade-10@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.background-color'

BackgroundColor.page = {
    layout: CssDoc,
    title: 'Background Color',
    description: 'The background-color CSS property sets the background color of an element.',
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

