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


export default function FontColor() {
    const colors = Style.colors 

    return (
        <>
            <ClassTable names={[
                ['font-color:`color`', 'font:`color`', 'f:`color`'],
                ['font:#`hex`'],
                ['font:rgb(`rgb`)'],
                ['font:hsl(`hsl`)']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>color</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the foreground <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value" target="blank">color value</a> of an&nbsp;
                element&rsquo;s text and <a href="text-decoration">text decorations</a>, and sets the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword" target="blank"><code>&lt;currentcolor&gt;</code></a>&nbsp;
                value.
            </p>
            <h3 id="colors">Colors</h3>
            <p>
                Use <code>color</code> please refer to <a href="colors" target="blank">Colors</a>.
            </p>
            <TextList 
                showClasses={
                    Object.keys(colors)
                    .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                    .map((colorName: string)=> `f:${colorName}-60`)
                }
                renderClasses="f:50 my:0!"
                >
            </TextList>
            <h3 id="hex">Hex</h3>
            <TextList 
                showClasses={
                    Object.keys(colors)
                    .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                    .map((colorName: string)=> `f:#${colors[colorName][60]}`)
                }
                renderClasses="f:50 my:0!"
                >
            </TextList>
            <h3 id="rgb">RGB</h3>
            <TextList 
                showClasses={
                    Object.keys(colors)
                    .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                    .map((colorName: string)=> {
                        const hexToRgb = (hex: string) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                            return result && { r: parseInt(result[1], 16), g:parseInt(result[2], 16), b:parseInt(result[3], 16)};
                        };
                        const eachColor = colors[colorName];
                        const hex = '#' + eachColor[60];
                        const rgb = hexToRgb(hex)
                        return `f:rgb(${rgb?.r},${rgb?.g},${rgb?.b})`
                    })
                }
                renderClasses="f:50 my:0!"
                >
            </TextList>
            <StyleFunctions name="font-color:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font-color:fade-10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font-color:fade-10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font-color:fade-10@print"></StyleMediaQueries>
            <StyleColorSchemes name="font-color:fade-10@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.font-color'

FontColor.page = {
    layout: CssDoc,
    title: 'Font Color',
    description: 'The color CSS property sets the foreground color value of an  element’s text and text decorations, and sets the <currentcolor>  value.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: 'color',
    canIUse: 'color'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
