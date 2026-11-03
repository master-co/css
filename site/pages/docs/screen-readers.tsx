import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ClassTable from '~/components/Css/ClassTable';
import StyleColorSchemes from '~/components/Css/StyleColorSchemes';
import StyleEditor from '~/components/Css/StyleEditor';
import StyleFunctions from '~/components/Css/StyleFunctions';
import StyleMediaQueries from '~/components/Css/StyleMediaQueries';
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints';
import StyleSelectors from '~/components/Css/StyleSelectors';
import CssDoc from '~/layouts/CssDoc'

export default function ScreenReaders() {

    return (
        <>
            <ClassTable names={[
                ['sr-only']
            ]}>
            </ClassTable>

            <h2 id="Overview">Overview</h2>
            <p>
                <a href="https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Accessibility#screenreaders" target="blank">Screen Readers
                </a> are definitely worth testing with a screenreader to get used to how severely visually impaired people use the web.
                Imporving the accessibility with screnn readers, it is necessary for people with reading disorders.
            </p>
            <StyleEditor
                tag="div"
                className="sr-only"
                renderHtml={(className: string) => `
                    <a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG" target="blank">
                        Learn more <span class="**sr-only**"> about web accessibility</span>
                    </a>
                `}
            />
            <span className="hint"><code>sr-only</code> is only display for screen reader.</span>

            <StyleFunctions name="sr-only"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="sr-only:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="sr-only@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="sr-only@print"></StyleMediaQueries>
            <StyleColorSchemes name="sr-only@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.screen-readers'

ScreenReaders.page = {
    layout: CssDoc,
    title: 'Screen Readers',
    description: 'Screen Readers are definitely worth testing with a screenreader to get used to how severely visually impaired people use the web. Imporving the accessibility with screnn readers, it is necessary for people with reading disorders.',
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
}
