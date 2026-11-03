import { useState } from 'react'
import Code from '~/components/Code'
import { markCodeWithPattern } from '~/utils/markCodeWithPattern';
import StylesHomeTab from '~/components/StylesHomeTab';
import StylesHomeTabs from '~/components/StylesHomeTabs';

import TransformSvg from '~/svgs/transform.svg'
import FilterSvg from '~/svgs/filter.svg'
import MixBlendSvg from '~/svgs/mix-blend.svg'
import GridSvg from '~/svgs/grid.svg'
import MaskSvg from '~/svgs/mask.svg'
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import { Trans, useTranslation } from 'next-i18next';

import originCode from '~/examples/ModernEffects.tsx?react2markup';
import ModernEffectsExample from '~/examples/ModernEffects';

const defaultPattern = 'rotate\\(-8\\)|translateY\\(-30\\)|translateY\\(-140\\)@sm|transform:scale\\(.8\\)rotate\\(8\\)|translate\\(-40,20\\)';

const ModernEffectsSection = () => {
    const { t } = useTranslation('home.css')
    const [code, setCode] = useState(markCodeWithPattern(originCode, defaultPattern))
    const markCode = (pattern: string) => {
        setCode(markCodeWithPattern(originCode, pattern))
    }
    return (
        <section className="p:50|10|0|10 p:120|40|0|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer grid-cols:1 grid-cols:9@md gap:30|0 gap:80@sm">
                <div className="grid-col-span:4 flex align-items:start justify-content:center">
                    <ModernEffectsExample />
                </div>
                <div className="grid-col-span:5">
                    <h5 className="homeSubtitle f:blue-70">{t('Modern effects')}</h5>
                    <h2 className="homeTitle">{t('Advanced effects, ready to use.')}</h2>
                    <p>
                        <Trans i18nKey="$ModernEffects" t={t}>
                            Want to rapidly add <code>filter</code>, <code>transform</code>, and <code>grid</code> ? We&#39;ve provided shorthand values like <code>scale(2)</code>, <code>blur(5)</code> to make it easier for you to implement modern CSS effects.
                        </Trans>
                    </p>
                    <StylesHomeTabs defaultName={t('Transform')}>
                        <StylesHomeTab Icon={TransformSvg} onChange={() => markCode(defaultPattern)} active>{t('Transform')}</StylesHomeTab>
                        <StylesHomeTab Icon={FilterSvg} onChange={() => markCode('blur\\(5\\)|sepia\\(1\\)|grayscale\\(1\\)')}>{t('Filter')}</StylesHomeTab>
                        <StylesHomeTab Icon={MixBlendSvg} onChange={() => markCode('blend:lighten')}>{t('Mix Blend')}</StylesHomeTab>
                        <StylesHomeTab Icon={GridSvg} onChange={() => markCode('grid-cols:3|gap:10|grid-col:2/2\\|span|grid-row:2/2\\|span')}>{t('Grid')}</StylesHomeTab>
                        <StylesHomeTab Icon={MaskSvg} onChange={() => markCode('mask-image:linear-gradient\\(black,transparent\\)')}>{t('Mask')}</StylesHomeTab>
                    </StylesHomeTabs>
                    <div className="mt:20 mx:-20@<md">
                        <Code lang="html" className="max-h:350 bb:0@<sm rb:0@<sm" lineNumbers>{code}</Code>
                    </div>
                </div>
            </div>
        </section >
    )
}

export default ModernEffectsSection