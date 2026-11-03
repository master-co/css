import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'


export default function BackdropFilter() {

    return (
        <>
            <ClassTable names={[
                    ['backdrop-filter:`value`', 'bd:`value`'],
                    ['backdrop-filter:`value`|`…`', 'bd:`value`|`…`'],
                    ['bd:none'],
                    ['bd:url(`svg`)'],
                    ['bd:blur(`value`)'],
                    ['bd:brightness(`value`)'],
                    ['bd:contrast(`value`)'],
                    ['bd:grayscale(`value`)'],
                    ['bd:hue-rotate({degree})'],
                    ['bd:invert(`value`)'],
                    ['bd:sepia(`value`)'],
                    ['bd:saturate(`value`)'],
                    ['bd:opacity(`value`)'],
                    ['bd:drop-shadow(`offset-x`|`offset-y`|`blur-radius`|`color`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>backdrop-filter</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                lets you apply graphical effects such as blurring or color shifting to the area behind an element. 
                Because it applies to everything <em>behind</em> the element, to see the effect you must make the
                element or its background at least partially transparent.
            </p>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover"
                showClasses={
                    [
                        'bd:invert(0)',
                        'bd:invert(1)',
                        'bd:grayscale(1)',
                        'bd:blur(`value`px)',
                        'bd:brightness(`value`%)',
                        'bd:contrast(`value`%)',
                        'bd:hue-rotate(`value`deg)',
                        'bd:sepia(`value`%)',
                        'bd:saturate(`value`%)',
                        'bd:opacity(`value`%)'
                    ]}
                showCover="true"
            />
            <StyleFunctions name="backdrop-filter:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="backdrop-filter:none:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="backdrop-filter:none@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="backdrop-filter:none@print"></StyleMediaQueries>
            <StyleColorSchemes name="backdrop-filter:none@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.backdrop-filter'

BackdropFilter.page = {
    layout: CssDoc,
    title: 'Backdrop Filter',
    description: 'The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything behind the element, to see the effect you must make the element or its background at least partially transparent.',
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

