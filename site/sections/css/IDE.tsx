import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import SortingSvg from '~/svgs/sorting.svg'
import SyntacticSugarSvg from '~/svgs/syntactic-sugar.svg'
import FastImplementation from '~/svgs/fast-implementation.svg'
// @ts-ignore
import { useTranslation } from 'next-i18next';
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import { useInView } from 'react-intersection-observer';
import Head from 'next/head';

const IDESection = () => {
    const { t } = useTranslation('home.css')
    const { ref: videoRef, inView } = useInView({ threshold: 0 })

    return (
        <section id="IDE" className="p:50|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <Head>
                <link rel="prefetch" href="/videos/language-service.mp4" as="video" />
            </Head>
            <div className="homeContainer">
                <h5 className="homeSubject f:green-70">
                    <hr className='homeHrLeft' />
                    <span>{t('IDE')}</span>
                    <hr className='homeHrRight' />
                </h5>
                <h2 className="f:30 f:48@md f:extrabold ls:-.25 t:center">{t('Make your IDE pro than ever.')}</h2>
                <p className="t:18 t:24@md t:center">{t('A forerunner to syntax highlighting for class names.')}</p>
                <div className="grid-cols:1 grid-cols:3@sm gap:40 mt:40">
                    <div className="flex gap:20">
                        <SortingSvg height="56" width="56" className="fill:green-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Code-completion')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Smart suggestions for style names, values, semantics and selectors.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap:20">
                        <SyntacticSugarSvg height="56" width="56" className="fill:green-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Syntax Highlighting')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Highlight class names to make them easier to read and identify.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap:20">
                        <FastImplementation height="56" width="56" className="fill:green-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Generate preview')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Hover over Master class names to see their CSS generation.')}
                            </p>
                        </div>
                    </div>
                </div>
                <video className="blend:lighten@dark w:full mt:40 aspect:1200/514" ref={videoRef} playsInline autoPlay loop muted>
                    {inView && <source src="/videos/language-service.mp4" type="video/mp4" />}
                </video>
                <StylesHomeLearnMore href='/docs/developer-tools' className="mt:40 flex w:fit mx:auto">{t('Learn more about Developer Tools')}</StylesHomeLearnMore>
            </div>
        </section>
    )
}

export default IDESection;