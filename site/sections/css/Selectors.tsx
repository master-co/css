import { useState } from 'react'
import Code from '~/components/Code'
import { markCodeWithPattern } from '~/utils/markCodeWithPattern';
import StylesHomeTab from '~/components/StylesHomeTab';
import StylesHomeTabs from '~/components/StylesHomeTabs';

import BehaviorSvg from '~/svgs/behavior.svg'
import ElementSvg from '~/svgs/element.svg'
import StructuralSvg from '~/svgs/structural.svg'
import CombinatorSvg from '~/svgs/combinator.svg'
import ChainingSvg from '~/svgs/chaining.svg'

import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import { Trans, useTranslation } from 'next-i18next';
import StatesAndSelectorsExample from '~/examples/StatesAndSelectors';
import originCode from '~/examples/StatesAndSelectors.tsx?react2markup';

const defaultPattern = ':hover|:active|:focus';

const Selectors = () => {
    const { t } = useTranslation('home.css')
    const [code, setCode] = useState(markCodeWithPattern(originCode, defaultPattern))
    const markCode = (pattern: string) => {
        setCode(markCodeWithPattern(originCode, pattern))
    }
    return (
        <section className="p:50|10|0|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer grid-cols:1 grid-cols:9@md gap:30|0 gap:80@sm">
                <div className="grid-col-span:4 flex align-items:start justify-content:center">
                    <StatesAndSelectorsExample />
                </div>
                <div className="grid-col-span:5">
                    <h5 className="homeSubtitle f:purple-70">{t('States and selectors')}</h5>
                    <h2 className="homeTitle">{t('Selectors are now possible.')}</h2>
                    <p>
                        <Trans i18nKey='$Selectors' t={t}>
                            Never thought to use CSS selectors like <code>:hover</code>, <code>:before</code>, <code>::placeholder</code>, and <code>:where()</code> directly in HTML?
                        </Trans>
                    </p>
                    <StylesHomeLearnMore href='/docs/selectors'>{t('Learn more about Selectors')}</StylesHomeLearnMore>
                    <StylesHomeTabs defaultName={t('Behavior')}>
                        <StylesHomeTab color="purple" Icon={BehaviorSvg} onChange={() => markCode(defaultPattern)} active>{t('Behavior')}</StylesHomeTab>
                        <StylesHomeTab color="purple" Icon={ElementSvg} onChange={() => markCode('::placeholder')}>{t('Element')}</StylesHomeTab>
                        <StylesHomeTab color="purple" Icon={CombinatorSvg} onChange={() => markCode('_li|>li')}>{t('Combinator')}</StylesHomeTab>
                        <StylesHomeTab color="purple" Icon={ChainingSvg} onChange={() => markCode('\\.active')}>{t('Chaining')}</StylesHomeTab>
                        <StylesHomeTab color="purple" Icon={StructuralSvg} onChange={() => markCode(':first')}>{t('Structural')}</StylesHomeTab>
                    </StylesHomeTabs>
                    <div className="mt:20 mx:-20@<md">
                        <Code lang="tsx" className="max-h:350 bb:0@<sm rb:0@<sm" lineNumbers>{code}</Code>
                    </div>
                </div>
            </div>
        </section >
    )
}

export default Selectors