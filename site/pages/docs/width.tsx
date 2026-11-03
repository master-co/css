import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import DocHTMLDemoCode from '~/components/DocHTMLDemoCode'
import CssDoc from '~/layouts/CssDoc'

export default function Width() {

    return (
        <>
            <ClassTable names={[
                ['width:`size`', 'w:`size`', 'w:`n/n`'],
                ['w:full'],
                ['w:fit'],
                ['w:max'],
                ['w:max'],
                ['w:3xs', 'w:360'],
                ['w:2xs', 'w:480'],
                ['w:xs', 'w:600'],
                ['w:sm', 'w:768'],
                ['w:md', 'w:1024'],
                ['w:lg', 'w:1280'],
                ['w:xl', 'w:1440'],
                ['w:2xl', 'w:1600'],
                ['w:3xl', 'w:1920'],
                ['w:4xl', 'w:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>width</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets an element&rsquo;s width. By default, it sets the width of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model#content_area" target="blank">content area</a>
                , but if <a href="box-sizing">box-sizing</a> is set to <code>border-box</code>, it sets the width of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model#border_area" target="blank">border area</a>.
            </p>
            <StyleEditor
                tag="div"
                className="w:max"
                names={[
                    'w:max',
                    'w:full',
                    'w:fit',
                    'w:60',
                    'w:70%',
                    'w:1/2',
                    'w:min',
                ]}
                renderHtml={(className: string) => `
                <div class="w:200 p:15 ..articleBox..">
                    <div class="**${className}** ..box focus.."></div>
                </div>

                `} />
            <h2 id="basic-usuage">Basic usuage</h2>
            {/* <h3 id="using-fraction-widths-to-layout">Using fraction widths to layout</h3>
            <DocHTMLDemoCode>
                {`
                    <div class="flex w:full">
                        <div class="w:1/2 box">1</div>
                        <div class="w:1/2 box">2</div>
                    </div>
                `}
            </DocHTMLDemoCode> */}
            
            {/* <h3 id="using-percentag-widths-to-layout">Using percentage widths to layout</h3> */}
            <StyleFunctions name="width:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="width:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="width:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="width:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="width:full@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.width'

Width.page = {
    layout: CssDoc,
    title: 'Width',
    description: 'The width CSS property sets an element’s width. By default, it sets the width of the content area, but if box-sizing is set to border-box, it sets the width of the border area.',
    editors: ['Aron', 'Lola'],
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
