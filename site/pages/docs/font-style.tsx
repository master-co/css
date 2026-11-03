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

export default function FontStyle() {
    return (
        <>
            <ClassTable names={[
                ['font-style:`style`', 'font:`style`', 'f:`style`'],
                ['font-style:oblique|`deg`'],
                ['font:normal'],
                ['italic'],
                ['oblique']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font-style</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets whether a font should be styled with a normal, italic, or oblique face from its <a href="font-family">font-family</a>.
            </p>
            <Demo className="align-items:start flex:col gap:32">
                {['font:normal', 'italic', 'oblique'].map((name) =>
                    <div key={name} >
                        <code className='f:fade f:gray-60@dark'>{name}</code>
                        <p className={name + ' font:medium font:20 m:0 color:inherit!'}>Heavy boxes perform quick waltzes and jigs.</p>
                    </div>
                )}
            </Demo>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="set-a-style-of-the-font">Set a style of the font</h3>
            {(() => {
                const code = `
                    <p class="**italic** ..font:medium font:20 m:0 color:inherit!..">
                        Heavy boxes perform quick waltzes and jigs.
                    </p>
                `
                return (
                    <>
                        <Demo html={code}></Demo>
                        <Code lang="html">{code}</Code>
                    </>
                )
            })()}
            <StyleFunctions name="font-style:$(style)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font-style:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font-style:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font-style:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="font-style:normal@dark"></StyleColorSchemes>
        </>
    )
}

FontStyle.page = {
    layout: CssDoc,
    title: 'Font Style',
    description: 'The font-style CSS property sets whether a font should be styled with a normal, italic, or oblique face from its font-family.',
    mdn: true,
    canIUse: true
};
