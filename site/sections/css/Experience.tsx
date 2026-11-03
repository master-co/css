import Code from '~/components/Code';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import Typing from '~/components/Typing';
import SortingSvg from '~/svgs/sorting.svg'
import SuccinctSvg from '~/svgs/succinct.svg'
import ConversionSvg from '~/svgs/conversion.svg'
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { render } from '@master/css/render'
import { Style, StyleSheet } from '@master/css'
import { beautifyCss } from '~/utils/beautifyCss'
import { parseToCssRules } from '~/utils/parseToCssRules';
// @ts-ignore
import * as Prism from 'prismjs/components/prism-core'
import { scrollToElement } from '~/utils/scrollToElement';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'next-i18next';
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import { CloneStyleSheet } from '~/utils/clone-style-sheet';

// 非關注的程式碼要 gray
const ExperienceSection = () => {
    const { t } = useTranslation('home.css')
    const [step, setStep] = useState(0)
    const [cssTextRules, setCssTextRules] = useState<any[] | null>()
    const htmlCodeRef = useRef<any>({})
    const cssCodeRef = useRef<any>({})
    const typingProps = {
        spaceDuration: 800,
        startDelay: 500,
        duration: 50,
        wordEndClass: 'flash',
        onWordEnd: () => {
            setTimeout(() => {
                const htmlText = htmlCodeRef.current.code.textContent || ''
                setCssTextRules(parseToCssRules(render(htmlText, { StyleSheet: CloneStyleSheet }).css))
            })
        }
    }
    const ProductionTyping =
        <Typing {...typingProps} onEnd={() => setStep(2)} startDelay={1000}>{[
            'block', ' ',
            'fixed', ' ',
            'p:16|32', ' ',
            'font:indigo', ' ',
            '@fade|1s'
        ]}</Typing>
    const BreakpointsTyping =
        <Typing {...typingProps} onEnd={() => setStep(3)}>{[
            'font:24', ' ',
            'font:56@4xl', ' ',
            'font:48@lg', ' ',
            'font:32@md'
        ]}</Typing>
    const BehaviorTyping =
        <Typing {...typingProps} onEnd={() => setStep(4)}>{[
            'bg:blue-36:hover', ' ',
            'bg:blue-40', ' ',
            'bg:blue-32:active'
        ]}</Typing>
    const UnitsTyping =
        <Typing {...typingProps}>{[
            'mt:16', ' ',
            'b:1', ' ',
            'w:64', ' ',
            'lh:1', ' ',
            'ls:.2', ' ',
            '@duration:300'
        ]}</Typing>
    const activateLine = (targetStep: number) => clsx('line', step < targetStep && 'inactive')

    const { ref: typingRef, inView: typingInView, entry: typingEntry } = useInView({ threshold: .6 })
    useEffect(() => {
        if (!typingEntry) return
        if (typingInView && !step) {
            setStep(1)
        }
    }, [typingInView, typingEntry, step])

    const { ref: typingContainerRef, inView: containerInView, entry: containerEntry } = useInView({ threshold: 0 })
    useEffect(() => {
        if (!containerEntry || containerInView) return
        setStep(0)
        setCssTextRules([])
    }, [containerInView, containerEntry])

    return (
        <section id="experience" className="p:50|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer">
                <h5 className="homeSubject f:blue-70">
                    <hr className='homeHrLeft' />
                    <span>{t('Experience')}</span>
                    <hr className='homeHrRight' />
                </h5>
                <h2 className="f:30 f:48@md f:extrabold ls:-.25 t:center">{t('Stay lazy for a better experience.')}</h2>
                <p className="t:18 t:24@md t:center">{t('Less coding, less thinking, less maintaining.')}</p>
                <div className="grid-cols:1 grid-cols:3@sm gap:40 mt:50">
                    <div className="flex gap:20">
                        <SuccinctSvg height="56" width="56" className="fill:blue-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Automatic Generation')}</h3>
                            <p className="mt:5 mb:0">
                                {t('No CSS rules to write, no CSS files to maintain.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap:20">
                        <SortingSvg height="56" width="56" className="fill:blue-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Intelligent Rules')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Sorting rules by behavior and breakpoints.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap:20">
                        <ConversionSvg height="56" width="56" className="fill:blue-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Unit Conversion')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Presets with practical units based on properties.')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid-cols:1 grid-cols:2@sm mt:40 h:442@sm" ref={typingContainerRef}>
                    <Code ref={htmlCodeRef} lang="html" manual lineNumbers className={'min-h:0 mx:-20@<md'} preClassName="animated rr:0@sm br:0!@sm" tabBarClassName="rr:0@sm br:0!@sm">
                        <div className="line"><span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>head</span><span className="token punctuation">&gt;</span></span></div>
                        <div className="line">    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>style</span> <span className="token attr-name">id</span><span className="token attr-value"><span className="token punctuation attr-equals">=</span><span className="token punctuation">&quot;</span>master-css<span className="token punctuation">&quot;</span></span><span className="token punctuation">&gt;</span></span><span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>style</span><span className="token punctuation">&gt;</span></span></div>
                        <div className="line"><span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>head</span><span className="token punctuation">&gt;</span></span></div>
                        <div className="line"><span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>body</span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(1)} ref={typingRef}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>h1</span> <span className="token attr-name">class</span><span className="token attr-value"><span className="token punctuation attr-equals">=</span><span className="token punctuation">&quot;</span>{step > 0 && ProductionTyping}<span className="token punctuation">&quot;</span></span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(1)}>        Watch how I speed up the production</div>
                        <div className={activateLine(1)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>h1</span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(2)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>h2</span> <span className="token attr-name">class</span><span className="token attr-value"><span className="token punctuation attr-equals">=</span><span className="token punctuation">&quot;</span>{step > 1 && BreakpointsTyping}<span className="token punctuation">&quot;</span></span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(2)}>        Watch how I sort the breakpoints</div>
                        <div className={activateLine(2)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>h2</span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(3)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>a</span> <span className="token attr-name">class</span><span className="token attr-value"><span className="token punctuation attr-equals">=</span><span className="token punctuation">&quot;</span>{step > 2 && BehaviorTyping}<span className="token punctuation">&quot;</span></span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(3)}>        Watch how I sort the behavior</div>
                        <div className={activateLine(3)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>a</span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(4)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;</span>p</span> <span className="token attr-name">class</span><span className="token attr-value"><span className="token punctuation attr-equals">=</span><span className="token punctuation">&quot;</span>{step > 3 && UnitsTyping}<span className="token punctuation">&quot;</span></span><span className="token punctuation">&gt;</span></span></div>
                        <div className={activateLine(4)}>        Watch how I convert the units</div>
                        <div className={activateLine(4)}>    <span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>p</span><span className="token punctuation">&gt;</span></span></div>
                        <div className="line"><span className="token tag"><span className="token tag"><span className="token punctuation">&lt;/</span>body</span><span className="token punctuation">&gt;</span></span></div>
                    </Code>
                    <Code ref={cssCodeRef} lang="css" lineNumbers manual className="min-h:0 h:200@<sm mx:-20@<md" preClassName="rl:0@sm @flashCode|1.5s_.line:not(:empty)" tabBarClassName="rl:0@sm">
                        <div className='line'>
                            <span className='token comment'>
                                {'/* Automatically generate CSS rules in <style id="master-css"> */'}
                            </span>
                        </div>
                        {cssTextRules?.map((cssTextRule) => <CssRuleLines key={cssTextRule} scrollElement={cssCodeRef.current.pre}>{cssTextRule}</CssRuleLines>)}
                    </Code>
                </div>
                <StylesHomeLearnMore href="/docs/why-master-css" className="mt:40 w:fit flex mx:auto">{t('Why should I use Master CSS?')}</StylesHomeLearnMore>
            </div>
        </section>
    )
}

function CssRuleLines({ children, scrollElement }: any) {
    const html = Prism.highlight(beautifyCss(children), Prism.languages.css, 'css')
    const lineRef = useRef<any>()
    const eachLineContents: [] = html
        .split('\n')
    return (
        <>
            {
                eachLineContents.map((eachLineContent, index) => (
                    <div className='line'
                        onAnimationStart={() => scrollToElement(lineRef.current, scrollElement, eachLineContents.length * 24 / 2)}
                        key={children + index}
                        ref={(el) => index === 0 && (lineRef.current = el)}
                        dangerouslySetInnerHTML={{ __html: eachLineContent }}>
                    </div>
                ))
            }
        </>
    )

}

export default ExperienceSection;