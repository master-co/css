import { Style } from '@master/css'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Fill() {
    const colors = Style.colors
    const svg =  <svg className="stroke:none m:auto"
                    xmlns="http://www.w3.org/2000/svg" width="103.81"
                    height="60"
                    viewBox="0 0 103.81 56.36">
                    <g>
                        <path fillRule="evenodd"
                            d="m91.635984,30.101004c-2.716,-4.806 -5,-5.52 -7.227,-5.52c-3.27,0 -5.542,3.022 -6.994,5.705l-5.8,11.909l1.58,2.591a21.635,21.635 0 0 0 29.112,9.136l1.507,-0.787l-12.178,-23.034z" />
                        <path fillRule="evenodd"
                            d="m12.177984,30.101004c2.716,-4.806 5,-5.52 7.228,-5.52c3.268,0 5.54,3.022 6.993,5.705l5.8,11.909l-1.58,2.591a21.635,21.635 0 0 1 -29.112,9.136l-1.507,-0.787l12.178,-23.034z" />
                        <path fillRule="evenodd"
                            d="m79.387984,6.487004c-4.229,-8.53 -16.923,-8.723 -21.225,-0.13l-6.252,11.975l-6.253,-11.975c-4.3,-8.593 -16.995,-8.4 -21.225,0.13l-8.134,15.738c3.861,-4.383 9.276,-1.8 11.631,2.66l8.773,16.147l4.487,8.582a11.884,11.884 0 0 0 5.11,5.2a12.405,12.405 0 0 0 11.221,0a11.888,11.888 0 0 0 5.109,-5.2l4.487,-8.582l8.773,-16.147c2.356,-4.461 7.77,-7.043 11.631,-2.66l-8.133,-15.738z" />
                    </g>
                </svg>

    return (
        <>
            <ClassTable names={[
                ['fill:`color`'],
                ['fill:#`hex`'],
                ['fill:rgb(`rgb`)'],
                ['fill:hsl(`hsl`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>fill</code></strong>&nbsp;attribute has two different meanings.
                For shapes and text it&#39;s a presentation attribute that defines the color (or any SVG paint servers like gradients or patterns) used to paint the element;
                for animation it defines the final state of the animation.
            </p>
            <h3 id="colors">Colors</h3>
            <p>
                Use <code>color</code> please refer to <a href="colors" target="blank">Colors</a>.
            </p>
            <BoxList
                showClasses={
                    Object.keys(colors)
                    .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                    .map((colorName: string, index) => `fill:${colorName}-60${index && Math.floor(index / 4) > 0 ? '/.' +  (5- Math.floor(index / 4)) : ''}`)
                }
            >
                {svg}
            </BoxList>
            <h3 id="hex">Hex</h3>
            <BoxList
                showClasses={
                    Object.keys(colors)
                    .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                    .map((colorName: string,index)=> {
                        const hexToRgb = (hex: string) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                            return result && { r: parseInt(result[1], 16), g:parseInt(result[2], 16), b:parseInt(result[3], 16)};
                        };
                        const eachColor = colors[colorName];
                        const hex = '#' + eachColor[60];
                        const rgb = hexToRgb(hex)
                        return `fill:rgb(${rgb?.r},${rgb?.g},${rgb?.b})`
                    })
                }
            >
                {svg}
            </BoxList>
            <h3 id="rgb">RGB</h3>
            <BoxList
                showClasses={
                    Object.keys(colors)
                    .filter((colorName) => colorName !== 'white' && colorName !== 'black')
                    .map((colorName: string,index)=> {
                        const hexToRgb = (hex: string) => {
                            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                            return result && { r: parseInt(result[1], 16), g:parseInt(result[2], 16), b:parseInt(result[3], 16)};
                        };
                        const eachColor = colors[colorName];
                        const hex = '#' + eachColor[60];
                        const rgb = hexToRgb(hex)
                        return `fill:rgb(${rgb?.r},${rgb?.g},${rgb?.b})`
                    })
                }
            >
                {svg}
            </BoxList>
            <StyleFunctions name="fill:$(color)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="fill:blue-60:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="fill:blue-60@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="fill:blue-60@print"></StyleMediaQueries>
            <StyleColorSchemes name="fill:blue-60@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.fill'

Fill.page = {
    layout: CssDoc,
    title: 'Fill',
    description: 'The fill attribute has two different meanings. For shapes and text it\'s a presentation attribute that defines the color (or any SVG paint servers like gradients or patterns) used to paint the element; for animation it defines the final state of the animation.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
