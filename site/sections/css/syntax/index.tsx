import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import SortingSvg from '~/svgs/sorting.svg'
import SyntacticSugarSvg from '~/svgs/syntactic-sugar.svg'
import FastImplementation from '~/svgs/fast-implementation.svg'
// @ts-ignore
import { Trans, useTranslation } from 'next-i18next';
import SemanticsSection from './Semantics';
import ShorthandsSection from './Shorthands';
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import GroupSection from './Groups';
import EnhancedSection from './Enhanced';

const SyntaxSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <section id="syntax" className="p:50|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer">
                <h5 className="homeSubject f:purple-70">
                    <hr className='homeHrLeft' />
                    <span>{t('Syntax')}</span>
                    <hr className='homeHrRight' />
                </h5>
                <h2 className="f:30 f:48@md f:extrabold ls:-.25 t:center">{t('Brief, but powerful.')}</h2>
                <p className="t:18 t:24@md t:center">{t('More succinct, more intuitive, more agile.')}</p>
                <div className="grid-cols:1 grid-cols:3@sm gap:40 mt:50">
                    <div className="flex gap:20">
                        <SortingSvg height="56" width="56" className="fill:purple-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('No naming constraints')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Composing UI like Lego without naming keeps the flexibility of modification.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap:20">
                        <SyntacticSugarSvg height="56" width="56" className="fill:purple-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Syntactic Sugar')}</h3>
                            <p className="mt:5 mb:0">
                                {t('Use shorthands, semantics, acronyms, symbols, groups to make your code leaner.')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap:20">
                        <FastImplementation height="56" width="56" className="fill:purple-70" />
                        <div className="flex:1">
                            <h3 className="f:18@md font:semibold">{t('Faster Implementation')}</h3>
                            <p className="mt:5 mb:0">
                                <Trans i18nKey="$Syntax3" t={t}>
                                    Directly add <code>@breakpoint</code>, <code>:selector</code>, and even <code>!important</code> to the suffix and it works right away.
                                </Trans>
                            </p>
                        </div>
                    </div>
                </div>
                <SemanticsSection />
                <StylesHomeLearnMore href='/docs/syntax-tutorial' className="mt:30">{t('Check out our Syntax Tutorial')}</StylesHomeLearnMore>
                <ShorthandsSection />
                <StylesHomeLearnMore href='/docs/syntax-tutorial' className="mt:30">{t('Check out our Syntax Tutorial')}</StylesHomeLearnMore>
                <EnhancedSection />
                <StylesHomeLearnMore href='/docs/syntax-tutorial' className="mt:30">{t('Check out our Syntax Tutorial')}</StylesHomeLearnMore>
                <GroupSection />
                <StylesHomeLearnMore href='/docs/syntax-tutorial' className="mt:30">{t('Check out our Syntax Tutorial')}</StylesHomeLearnMore>
            </div>
        </section>
    )
}

export default SyntaxSection;