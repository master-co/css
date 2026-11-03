import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import WebpackSvg from '~/svgs/webpack.svg'
import GruntSvg from '~/svgs/grunt.svg'
import SassSvg from '~/svgs/sass.svg'
import PostcssSvg from '~/svgs/postcss.svg'
import AutoprefixerSvg from '~/svgs/autoprefixer.svg'
import Code from '~/components/Code';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';

const ZeroConfigurationSection = () => {
    return (
        <>
            <section className="p:50|10 p:120|40@md rel">
                <StylesHomeGridsBg />
                <div className="homeContainer">
                    <h5 className="homeSubtitle f:purple-70">Zero configuration</h5>
                    <h2 className="homeTitle">😵‍💫 The build environment is so complicated.</h2>
                    <p className="max-w:750">This&#39;s a standalone javascript package that doesn&#39;t depend on any build tools, just import it ( or use CDNs ) to
                        start production right away:</p>
                    <Code lang="html" scrollbar={false}>{`
                        <script src="https://cdn.master.co/css"></script>
                    `}</Code>
                    <StylesHomeLearnMore href="/docs/setup" className="mt:30">Get started with zero configuration</StylesHomeLearnMore>
                    <div className="flex gap:50 mt:50 overflow-x:auto mx:-30@<md px:30@<md">
                        <div className="flex align-items:center gap:15">
                            <WebpackSvg width="56" height="56" />
                            <div className="f:32">
                                <b className="text-decoration:.1em|line-through|red/.7">Webpack</b>
                            </div>
                        </div>
                        <div className="flex align-items:center gap:15">
                            <GruntSvg width="56" height="56" />
                            <div className="f:32">
                                <b className="text-decoration:.1em|line-through|red/.7">Grunt</b>
                            </div>
                        </div>
                        <div className="flex align-items:center gap:15">
                            <SassSvg width="56" height="56" />
                            <div className="f:32">
                                <b className="text-decoration:.1em|line-through|red/.7">Sass</b>
                            </div>
                        </div>
                        <div className="flex align-items:center gap:15">
                            <AutoprefixerSvg width="56" height="56" />
                            <div className="f:32">
                                <b className="text-decoration:.1em|line-through|red/.7">Autoprefixer</b>
                            </div>
                        </div>
                        <div className="flex align-items:center gap:15">
                            <PostcssSvg width="56" height="56" />
                            <div className="f:32">
                                <b className="text-decoration:.1em|line-through|red/.7">PostCSS</b>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ZeroConfigurationSection;