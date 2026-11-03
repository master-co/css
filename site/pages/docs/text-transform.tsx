import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Fragment } from 'react'
import Code from '~/components/Code'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import Demo from '~/components/Demo'
import CssDoc from '~/layouts/CssDoc'

export default function TextTransform() {

    return (
        <>
            <ClassTable names={[
                ['text-transform:`transform`', 'text:`transform`', 't:`transform`'],
                ['text-transform:none'],
                ['capitalize'],
                ['lowercase'],
                ['uppercase']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>text-transform</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                specifies how to capitalize an element&rsquo;s text.
                It can be used to make text appear in all-uppercase or all-lowercase, or with each word capitalized. It also can help improve legibility for ruby.
            </p>
            <Demo className="align-items:start flex:col gap:32">
                {['capitalize', 'lower', 'uppercase', 'uppercase::first-letter', 'text-transform:none'].map((name) =>
                    <div key={name} >
                        <code className='f:fade f:gray-60@dark'>{name}</code>
                        <p className={name + ' font:medium font:20 m:0 color:inherit!'}>heavy boxes perform quick waltzes and jigs.</p>
                    </div>
                )}
            </Demo>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="transform-text">Transform text</h3>
            {(() => {
                const code = `
                    <p class="**capitalize** ..font:medium font:20 m:0 color:inherit!..">
                        heavy boxes perform quick waltzes and jigs.
                    </p>
                `
                return (
                    <>
                        <Demo html={code}></Demo>
                        <Code lang="html">{code}</Code>
                    </>
                )
            })()}
            <StyleFunctions name="text-transform:$(size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="text-transform:uppercase:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="text-transform:uppercase@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="text-transform:uppercase@print"></StyleMediaQueries>
            <StyleColorSchemes name="text-transform:uppercase@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.text-transform'

TextTransform.page = {
    layout: CssDoc,
    title: 'Text Transform',
    description: 'The text-transform CSS property specifies how to capitalize an element’s text. It can be used to make text appear in all-uppercase or all-lowercase, or with each word capitalized. It also can help improve legibility for ruby.',
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

