import Code from '~/components/Code';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import InjectionSvg from '~/svgs/injection.svg'
import SharingSvg from '~/svgs/sharing.svg'
import HybridSvg from '~/svgs/hybrid.svg'
import CodeTabs from '~/components/Code/CodeTabs';
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import { useTranslation } from 'next-i18next';

const PerformanceSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <>
            <section id="performance" className="p:50|10 p:120|40@md rel">
                <StylesHomeGridsBg />
                <div className="homeContainer">
                    <h5 className="homeSubject f:cyan-70">
                        <hr className='homeHrLeft' />
                        <span>{t('Performance')}</span>
                        <hr className='homeHrRight' />
                    </h5>
                    <h2 className="f:30 f:48@md f:extrabold ls:-.25 t:center">{t('Hybrid Rendering')}</h2>
                    <p className="t:18 t:24@md t:center">{t('You get runtime flexibility and faster page loads.')}</p>
                    <div className="grid-cols:1 grid-cols:3@md gap:40 mt:50">
                        <div className="flex gap:20">
                            <InjectionSvg height="56" width="56" className="fill:cyan-70" />
                            <div className="flex:1">
                                <h3 className="f:18@md font:semibold">{t('On-demand Injection')}</h3>
                                <p className="mt:5 mb:0">{t('Scan class names of the current page, and only generate the CSS required by the current page.')}</p>
                            </div>
                        </div>
                        <div className="flex gap:20">
                            <HybridSvg height="56" width="56" className="fill:cyan-70" />
                            <div className="flex:1">
                                <h3 className="f:18@md font:semibold">{t('AOT and JIT')}</h3>
                                <p className="mt:5 mb:0">{t('Generate CSS ahead of time to improve FCP and continue to use JIT on the browser side.')}</p>
                            </div>
                        </div>
                        <div className="flex gap:20">
                            <SharingSvg height="56" width="56" className="fill:cyan-70" />
                            <div className="flex:1">
                                <h3 className="f:18@md font:semibold">{t('Sharing CSS Rules')}</h3>
                                <p className="mt:5 mb:0">{t('With a diffing algorithm, CSS rules won\'t be duplicated, which reduces output size.')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid-cols:1 grid-cols:2@sm mt:40 h:442@sm">
                        <CodeTabs className="mt:0! mx:-20@<md" tabBarClassName="{rr:0;br:0}@sm">{[
                            {
                                name: 'server.js', lang: 'js',
                                code: `
                                    import * as express from 'express';
                                    import { Style, StyleSheet } from '@master/css';
                                    import { render } from '@master/css/render';

                                    // A simple example for express
                                    app.get('/', function(req, res) {
                                        res.render('index.html', (error, html) => {
                                            if (err) console.log(err)
                                            return render(html, { StyleSheet }).html;
                                        })
                                    })
                                `,
                                addLines: [9],
                                preClassName: '{rr:0;br:0}@sm',
                                lineNumbers: true
                            },
                            {
                                name: 'src/index.html', lang: 'html',
                                code: homeHtml,
                                preClassName: '{rr:0;br:0}@sm',
                                lineNumbers: true
                            }
                        ]}</CodeTabs>
                        <div className='flex flex:col min-h:0'>
                            <Code lang="html" name="Master CSS - A Virtual CSS language with enhanced syntax" lineNumbers showControls className="h:1/2 mx:-20@<md" preClassName="rl:0@sm rrb:0" tabBarClassName="rl:0@sm">
                                {`
                                    <!-- User gets pre-rendered HTML on the browser side. -->
                                    <!DOCTYPE html>
                                    <html lang="en">
                                    <head>
                                        **<style id="master-css">...</style>**
                                        <title>Master CSS - A Virtual CSS language with enhanced syntax</title>
                                        <meta charset="utf-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1">
                                        <script src="https://cdn.master.co/css"></script>
                                    </head>
                                    <body>
                                        <h1 class="**block** **font:48@md** **p:12**">Hello World</h1>
                                        <a class="**bg:blue** **bg:blue-64:hover**">Get Started</a>
                                        <p class="**bg:blue** **bg:blue-64:hover**">Sharing CSS Rules</p>
                                    </body>
                                    </html>
                                `}
                            </Code>
                            <Code lang='css' lineNumbers className="h:1/2 mx:-20@<md" preClassName="bt:0 rl:0 rrt:0">{`
                                /* <style id="master-css"> */
                                .block {
                                    display: block
                                }

                                .p\\:12 {
                                    padding: 0.75rem
                                }
                                
                                .bg\\:blue {
                                    background-color: #175fe9
                                }
                                
                                .bg\\:blue-64\\:hover:hover {
                                    background-color: #6599f0
                                }
                                
                                @media (min-width:1024px) {
                                    .font\\:48\\@md {
                                        font-size: 3rem
                                    }
                                }
                            `}</Code>
                        </div>
                    </div>
                    <StylesHomeLearnMore href="/docs/hybrid-rendering" className="mt:40 w:fit flex mx:auto">{t('Learn more about Hybrid Rendering')}</StylesHomeLearnMore>
                </div>
            </section>
            {/* hybrid rendering 用 page1 page2 page3 示範 */}
        </>
    )
}

const homeHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Master CSS - A Virtual CSS language with enhanced syntax</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.master.co/css"></script>
    </head>
    <body>
        <h1 class="**block** **font:48@md** **p:12**">Hello World</h1>
        <a class="**bg:blue** **bg:blue-64:hover**">Get Started</a>
        <p class="**bg:blue** **bg:blue-64:hover**">Sharing CSS Rules</p>
    </body>
    </html>
`

export default PerformanceSection;