import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleEditor from '~/components/Css/StyleEditor'
import ShorthandList from '~/components/Css/ShorthandList'
import BoxList from '~/components/Css/BoxList'
import Code from '~/components/Code'
import CodeTabs from '~/components/Code/CodeTabs'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function AnimationName() {

    return (
        <>
            <ClassTable names={[
                ['animation-name:`name`,`…`', '@name:`name`,`…`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>animation-name</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a>&nbsp;
                property specifies the names of one or more&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes" target="blank">@keyframes</a>&nbsp;
                at-rules describing the animation or animations to apply to the element.
            </p>
            <h2 id="official-keyframes">Official keyframes</h2>
            <p>
                We provide a set of keyframes commonly used:
            </p>
            <BoxList
                showClasses={[
                    '@name:fade',
                    '@name:ping',
                    '@name:flash',
                    '@name:heart',
                    '@name:jump',
                    '@name:pulse',
                    '@name:rotate',
                    '@name:shake',
                    '@name:zoom',
                    '@name:float'
                ]}
                renderClasses="b:5|solid|blue-60 my:50! @duration:1s @iteration-count:infinite">
            </BoxList>
            
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="add-with-custom-keyframes">Add with custom keyframes</h3>
            <p>
                First, define  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes" target="blank">@keyframes</a>&nbsp; 
                in your css file or <code>&lt;style&gt;</code>.
            </p>
            <Code lang="css" name="custom.css">
                {`
                    @keyframes demo {
                        from {
                            left: 0px;
                            top: 0px;
                            background: rgba(83, 140, 238, .2);
                            border-color: rgb(83, 140, 238);
                        }
                    
                        to {
                            left: 150px;
                            top: 0px;
                            background: rgba(235, 95, 99, .5);
                            border-color: rgb(235, 95, 99);
                        }
                    }
                `}
            </Code>
            <p>
                Now, set the animation classes for the element.
            </p>
            <StyleEditor
                tag="div"
                className="@demo|ease-in|1s|infinite|alternate"
                showCss="true"
                hideHtml="true"
                renderHtml={(className: string) => `
                <div class="..grid-cols:1 gap:20 w:full h:200..">
                    <div class="${className} f:12! w:100 h:100 m:auto bg:blue-60/.2 r:5 b:5|solid|blue-60"></div>
                </div>
                `} />

            <StyleFunctions name="@name:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="@name:fade:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="@name:fade@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="@name:fade@print"></StyleMediaQueries>
            <StyleColorSchemes name="@name:fade@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.animation-name'

AnimationName.page = {
    layout: CssDoc,
    title: 'Animation Name',
    description: 'The animation-name CSS  property specifies the names of one or more @keyframes  at-rules describing the animation or animations to apply to the element.',
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

