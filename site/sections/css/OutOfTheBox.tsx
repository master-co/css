import { useState } from 'react'
import Code from '~/components/Code'
import { markCodeWithPattern } from '~/utils/markCodeWithPattern';
import StylesHomeTab from '~/components/StylesHomeTab';
import StylesHomeTabs from '~/components/StylesHomeTabs';

import TypographySvg from '~/svgs/typography.svg'
import SizingSvg from '~/svgs/sizing.svg'
import SpacingSvg from '~/svgs/spacing.svg'
import BackgroundSvg from '~/svgs/background.svg'
import BorderSvg from '~/svgs/border.svg'

import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import { useTranslation } from 'next-i18next';

import OutOfTheBoxExample from '~/examples/OutOfTheBox';
import originCode from '~/examples/OutOfTheBox.tsx?react2markup';

const defaultPattern = 'font:24|font:14|font:bold|font:gray-66|font:semibold|font:0|font:12|capitalize|uppercase|text:underline|letter-spacing:2';

const OutOfTheBoxSection = () => {
    const { t } = useTranslation('home.css')
    const [code, setCode] = useState(markCodeWithPattern(originCode, defaultPattern))
    const markCode = (pattern: string) => {
        setCode(markCodeWithPattern(originCode, pattern))
    }
    return (
        <section className="p:50|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer grid-cols:1 grid-cols:9@md gap:30|0 gap:80@sm">
                <div className="grid-col-span:4 flex align-items:start justify-content:center">
                    <OutOfTheBoxExample />
                </div>
                <div className="grid-col-span:5">
                    <h5 className="homeSubtitle f:blue-70">{t('Style variants')}</h5>
                    <h2 className="homeTitle">{t('186+ styles out of the box.')}</h2>
                    <p>
                        {t("The styles are pre-configured and optimized, so you can build whatever you want right away.")}
                    </p>
                    <StylesHomeTabs defaultName={t('Typography')}>
                        <StylesHomeTab Icon={TypographySvg} onChange={() => markCode(defaultPattern)} active>{t('Typography')}</StylesHomeTab>
                        <StylesHomeTab Icon={SizingSvg} onChange={() => markCode('w:full|h:full|w:40|h:40|max-w:350|square|full')}>{t('Sizing')}</StylesHomeTab>
                        <StylesHomeTab Icon={SpacingSvg} onChange={() => markCode('p:10\\|15|p:10|mt:10|mt:12|gap:8|mt:20|p:3|mt:5|p:15')}>{t('Spacing')}</StylesHomeTab>
                        <StylesHomeTab Icon={BorderSvg} onChange={() => markCode('r:5|r:10|round|b:1\\|solid\\|gray-28')}>{t('Border')}</StylesHomeTab>
                        <StylesHomeTab Icon={BackgroundSvg} onChange={() => markCode('bg:gray-22|bg:white|bg:#999|bg:#333|bg:gray-28')}>{t('Background')}</StylesHomeTab>
                    </StylesHomeTabs>
                    <div className="mt:20 mx:-20@<md">
                        <Code lang="html" className="max-h:350 bb:0@<sm rb:0@<sm" lineNumbers>{code}</Code>
                    </div>
                </div>
            </div>
        </section >
    )
}

export default OutOfTheBoxSection