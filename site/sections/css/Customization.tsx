import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import StylesHomeTab from '~/components/StylesHomeTab';
import StylesHomeTabs from '~/components/StylesHomeTabs';

import ClassesSvg from '~/svgs/classes.svg'
import ValuesSvg from '~/svgs/values.svg'
import SemanticsSvg from '~/svgs/semantics.svg'
import BreakpointsSvg from '~/svgs/breakpoints.svg'
import ColorsSvg from '~/svgs/colors.svg'
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import Code from '~/components/Code';
import { useState } from 'react';
import { useTranslation } from 'next-i18next';

const CustomizationSection = () => {
    const { t } = useTranslation('home.css')
    const [htmlCode, setHtmlCode] = useState('')
    const [jsCode, setJsCode] = useState('')
    const setClassesCode = () => {
        setJsCode(`
            import { Style } from '@master/css';
             
            Style.extend('classes', {
                btn: 'px:18 h:40 font:14 font:medium r:4 inline-flex align-items:center',
                container: 'max-w:1280 px:20 px:40@sm mx:auto'
            });
        `)
        setHtmlCode(`
            <!-- ${t('Using them in your HTML would look like this.')} -->
            <button class="**btn** bg:blue-60 bg:blue-36:hover">
                Submit
            </button> 
             
            <div class="**container** text:center">
                <h2>Customize to your design system.</h2>
            </div>
        `)
    }
    // init
    if (!htmlCode && !jsCode) {
        setClassesCode()
    }
    return (
        <>
            <section id="customization" className="p:50|10 p:120|40@md rel">
                <StylesHomeGridsBg />
                <div className="homeContainer">
                    <h5 className="homeSubject f:pink-70">
                        <hr className='homeHrLeft' />
                        <span>{t('Customization')}</span>
                        <hr className='homeHrRight' />
                    </h5>
                    <h2 className="f:30 f:48@md f:extrabold ls:-.25 t:center">{t('Customize to your design system.')}</h2>
                    <p className="t:18 t:24@md t:center">{t('Sometimes arbitrary, sometimes unified.')}</p>
                    <StylesHomeTabs defaultName={t('Classes')} className="max-w:fit mx:auto">
                        <StylesHomeTab color="pink" Icon={ClassesSvg} onChange={setClassesCode}>{t('Classes')}</StylesHomeTab>
                        <StylesHomeTab color="pink" Icon={BreakpointsSvg} onChange={() => {
                            setJsCode(`
                                import { Style } from '@master/css';
                                 
                                Style.extend('breakpoints', {
                                    tablet: '768px', // => @media (min-width: 768px) { ... }
                                    laptop: '1024px', // => @media (min-width: 1024px) { ... }
                                    desktop: '1280px', // => @media (min-width: 1280px) { ... }
                                });
                            `)
                            setHtmlCode(`
                                <!-- ${t('Using them in your HTML would look like this.')} -->
                                <h1 class="font:24**@tablet** font:32**@laptop** font:48**@desktop**">
                                    Responsive font sizes
                                </h1>
                                 
                                <div class="text:center**@tablet&<desktop**">
                                    try using operators
                                </div>
                            `)
                        }}>{t('Breakpoints')}</StylesHomeTab>
                        <StylesHomeTab color="pink" Icon={ColorsSvg} onChange={() => {
                            setJsCode(`
                                import { Style } from '@master/css';
                                 
                                Style.extend('colors', {
                                    'tiffany-blue': '0abab5',
                                    bee: 'f2b413',
                                    purple: {
                                        '': '491d8b',
                                        50: 'a56eff',
                                        60: '8a3ffc',
                                        70: '6929c4',
                                    }
                                }
                            `)
                            setHtmlCode(`
                                <!-- ${t('Using them in your HTML would look like this.')} -->
                                <p class="font:**tiffany-blue**"></p>
                                <p class="font:**bee**"></p>
                                <p class="font:**purple-40**/.5">change color alpha</p>
                            `)
                        }}>{t('Colors')}</StylesHomeTab>
                        <StylesHomeTab color="pink" Icon={ValuesSvg} onChange={() => {
                            setJsCode(`
                                import { Styles } from '@master/css';
                                 
                                const sizing = {
                                    '1x': '.5rem',
                                    '2x': '.75rem',
                                    '3x': '1rem',
                                    '4x': '1.5rem',
                                    '5x': '2rem',
                                    '6x': '3rem'
                                }
                                 
                                Styles.extend('values', {
                                    width: sizing,
                                    spacing: sizing,
                                    margin: sizing,
                                    padding: sizing
                                })
                            `)
                            setHtmlCode(`
                                <!-- ${t('Using them in your HTML would look like this.')} -->
                                <div class="width:**2x** mt:**3x** p:**5x**"></div>
                            `)
                        }}>{t('Values')}</StylesHomeTab>
                        <StylesHomeTab color="pink" Icon={SemanticsSvg} onChange={() => {
                            setJsCode(`
                                import { Styles } from '@master/css';
                                 
                                Styles.extend('semantics', {
                                    display: {
                                        show: 'block' // => display: block;
                                    },
                                    fontSize: {
                                        'hide-text': 0 // => font-size: 0rem;
                                    }
                                })
                            `)
                            setHtmlCode(`
                                <!-- ${t('Using them in your HTML would look like this.')} -->
                                <div class="**show**@sm" hidden></div>
                                <div class="**hide-text**"></div>
                            `)
                        }}>{t('Semantics')}</StylesHomeTab>
                    </StylesHomeTabs>
                    <div className="grid-cols:1 grid-cols:2@sm mt:20 h:300@sm">
                        <Code lang="js" lineNumbers name="master.css.js" className="min-h:0 mx:-20@<md" preClassName="rr:0@sm br:0!@sm" tabBarClassName="rr:0@sm br:0!@sm">{jsCode}</Code>
                        <Code lang="html" lineNumbers name="index.html" className="min-h:0 mx:-20@<md" preClassName="rl:0@sm" tabBarClassName="rl:0@sm">{htmlCode}</Code>
                    </div>
                    <StylesHomeLearnMore href="/docs/customization" className="mt:40 w:fit flex mx:auto">{t('Learn more about Customization')}</StylesHomeLearnMore>
                </div>
            </section>
        </>
    )
}

export default CustomizationSection;