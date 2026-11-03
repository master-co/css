import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FlexBasis() {

    return (
        <>
            <ClassTable names={[
                ['flex-basis:`basis`'],
                ['flex-basis:full'],
                ['flex-basis:fit'],
                ['flex-basis:max'],
                ['flex-basis:max'],
                ['flex-basis:3xs', 'flex-basis:360'],
                ['flex-basis:2xs', 'flex-basis:480'],
                ['flex-basis:xs', 'flex-basis:600'],
                ['flex-basis:sm', 'flex-basis:768'],
                ['flex-basis:md', 'flex-basis:1024'],
                ['flex-basis:lg', 'flex-basis:1280'],
                ['flex-basis:xl', 'flex-basis:1440'],
                ['flex-basis:2xl', 'flex-basis:1600'],
                ['flex-basis:3xl', 'flex-basis:1920'],
                ['flex-basis:4xl', 'flex-basis:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>flex-basis</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the initial main size of a flex item. It sets the size of the content box unless otherwise set with&nbsp;
                <a href="box-sizing" target="blank">box-sizing</a>
            </p>
            <StyleEditor
                tag="div"
                className="flex-basis:240"
                names={[
                    'flex-basis:full',
                    'flex-basis:fit',
                    'flex-basis:max',
                    'flex-basis:min'
                ]}
                renderHtml={(className: string) => `
                    <div class="w:full flex gap:10">
                        <div class="**${className}** ..box focus..">${className}</div>
                        <div class="flex-basis:75 ..box..">75</div>
                        <div class="flex-basis:150 ..box..">150</div>
                        <div class="flex-basis:225 ..box..">225</div>
                    </div>
                `} />
           
            <StyleFunctions name="flex-basis:$(direction)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="flex-basis:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="flex-basis:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="flex-basis:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="flex-basis:full@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.flex-basis'

FlexBasis.page = {
    layout: CssDoc,
    title: 'Flex Basis',
    description: 'The flex-basis CSS property sets the initial main size of a flex item. It sets the size of the content box unless otherwise set with box-sizing',
    editors: ['Aron','Lola'],
    localeNamespace
,
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

