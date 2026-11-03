import Typing from '~/components/Typing';
import { useEffect, useState } from 'react';
import BreakpointsSvg from '~/svgs/breakpoints.svg'
import ColorsSvg from '~/svgs/colors.svg'
import SelectorsSvg from '~/svgs/selectors.svg'
import StylesSvg from '~/svgs/styles.svg'
import MediaSvg from '~/svgs/media.svg'
import FunctionSvg from '~/svgs/function.svg'
import SchemesSvg from '~/svgs/schemes.svg'
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import ALink from '~/components/ALink';
import Head from 'next/head';

const HeroSection = () => {

    const { t } = useTranslation('home.css');
    const [step, setStep] = useState(0);
    const { ref: typingRef, inView: typingInView, entry: typingEntry } = useInView({ threshold: 1 })
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const [isVideoFetched, setIsVideoFetched] = useState(false)

    useEffect(() => {
        if (!typingEntry) return
        setStep(typingInView ? 1 : 0)
    }, [typingInView, typingEntry])

    useEffect(() => {
        if (isVideoFetched) return
        setIsVideoFetched(true)
        fetch('/videos/ionic-pattern.mp4').then((value) => {
            setIsVideoLoaded(true)
        })
    }, [isVideoFetched])

    return (
        <section id="design" className="rel p:140|0|30 p:180|0|60@md overflow:hidden">
            <Head>
                <link rel="prefetch" href="/videos/ionic-pattern.mp4" as="video" />
            </Head>
            <video className="
                    abs full left:0 top:0 blend:color-dodge object:cover untouchable
                    bg:gray-10 contain:layout
                    mask-image:linear-gradient(black,transparent)
                " playsInline preload='none' autoPlay poster='/images/hero.jpg' loop muted>
                {isVideoLoaded && <source src="/videos/ionic-pattern.mp4" type="video/mp4" />}
            </video>
            <div className="max-w:1100 px:30 px:40@md mx:auto t:center">
                <h1 className="font:40 font:64@md font:heavy ls:-.25 lh:1">{t('A Virtual CSS language with enhanced syntax.')}</h1>
                <p className="max-w:800 mx:auto block text:center font:18 font:24@md lh:1.5">{t('Efficiently build your UI and design system with HTML only.')}</p>
                <p className="f:18@md contain:content mb:50">
                    <code className="language-html contain:strict f:22@md mt:5"><span
                        className="token tag">
                        <span className="token punctuation">&lt;</span>
                        <span className="token tag">button </span>
                        <span ref={typingRef} className="token attr-name">class</span><span className="token attr-value"><span
                            className="token punctuation attr-equals">=</span><span
                                className="token punctuation">&#34;</span>
                            <span>btn </span>
                            {step > 0 && <Typing gap={1500} startDelay={1000} duration={50} backspaceDuration={30}>{[
                                'font:14', 0,
                                'bg:blue:hover', 0,
                                'text:center@sm', 0,
                                'width:calc(100%-20px)', 0,
                                'opacity:.5[disabled]', 0,
                                'font:#fff@dark'
                            ]}</Typing>}
                            <span className="token punctuation">&#34;</span></span></span>
                        <span className="token punctuation">&gt;</span>
                    </code>
                </p>
                <div className='grid-cols:2 bd:blur(12) r:8 max-w:360 mx:auto'>
                    <ALink href="/docs/setup" className="
                            f:purple-70 bg:purple-70/.05 bg:purple-70/.1:hover b:1|solid|purple-70/.05 br:purple-70/.0
                            px:25 rl:8 h:56
                            inline-flex center-content
                            t:center f:14 ls:1 lh:1 w:full@<md f:medium mr:-1
                        ">
                        {t('Get Started')}
                    </ALink>
                    <ALink href="/docs/why-master-css" className="
                            f:blue-70 bg:blue-70/.05 bg:blue-70/.1:hover b:1|solid|blue-70/.05 bl:blue-70/.0
                            px:25 rr:8 h:56
                            inline-flex center-content
                            t:center f:14 ls:1 lh:1 w:full@<md f:medium
                        ">
                        {t('Why Master')}
                    </ALink>
                </div>
                <p className='text:center t:12 mt:16'>
                    {t('All features included in')} <a href="https://bundlephobia.com/package/@master/css" target="blank" className="t:underline">~14KB</a>
                </p>
                <div className="grid-cols:3 grid-cols:4@xs grid-cols:7@md gap:10 mt:50">
                    <div className="p:20 square">
                        <StylesSvg className="fill:blue-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('styles')}</code>
                    </div>
                    <div className="p:20 square">
                        <SelectorsSvg className="fill:purple-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('selector')}</code>
                    </div>
                    <div className="p:20 square">
                        <BreakpointsSvg className="fill:pink-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('breakpoints')}</code>
                    </div>
                    <div className="p:20 square">
                        <ColorsSvg className="fill:teal-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('colors')}</code>
                    </div>
                    <div className="p:20 square">
                        <MediaSvg className="fill:cyan-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('@media')}</code>
                    </div>
                    <div className="p:20 square">
                        <FunctionSvg className="fill:green-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('function()')}</code>
                    </div>
                    <div className="p:20 square">
                        <SchemesSvg className="fill:gray-70 mx:auto" height="56" width="56" />
                        <code className="block font:12 font:14@md mt:20">{t('schemes')}</code>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
