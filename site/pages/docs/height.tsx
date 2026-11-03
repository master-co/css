import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Height() {

    return (
        <>
            <ClassTable names={[
                 ['height:`size`', 'h:`size`'],
                 ['h:full'],
                 ['h:fit'],
                 ['h:max'],
                 ['h:max'],
                 ['h:3xs', 'h:360'],
                 ['h:2xs', 'h:480'],
                 ['h:xs', 'h:600'],
                 ['h:sm', 'h:768'],
                 ['h:md', 'h:1024'],
                 ['h:lg', 'h:1280'],
                 ['h:xl', 'h:1440'],
                 ['h:2xl', 'h:1600'],
                 ['h:3xl', 'h:1920'],
                 ['h:4xl', 'h:2560'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>height</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets an element&rsquo;s height. By default, it sets the height of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model#content_area" target="blank">content area</a>
                , but if <a href="box-sizing">box-sizing</a> is set to <code>border-box</code>, it sets the height of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Introduction_to_the_CSS_box_model#border_area" target="blank">border area</a>.
            </p>
            <StyleEditor
                tag="div"
                className="h:max"
                names={[
                    'h:max',
                    'h:full',
                    'h:fit',
                    'h:60',
                    'h:70%',
                    'h:min',
                ]}
                renderHtml={(className: string) => `
                <div class="h:200 p:15 writing-mode:vertical-rl ..articleBox..">
                    <code class="**${className}** ..box focus..">
                        I know CSS very well.
                    </code>
                </div>

                `} />
            <StyleFunctions name="height:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="height:full:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="height:full@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="height:full@print"></StyleMediaQueries>
            <StyleColorSchemes name="height:full@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.height'

Height.page = {
    layout: CssDoc,
    title: 'Height',
    description: 'The height CSS property sets an element’s height. By default, it sets the height of the content area, but if box-sizing is set to border-box, it sets the height of the border area.',
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
