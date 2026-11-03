import { useState } from 'react'
import Code from '~/components/Code'
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import IFrame from '~/components/IFrame';
import { Trans, useTranslation } from 'next-i18next';
import codeOfResponsiveBreakpoints from '~/pages/examples/responsive-breakpoints.tsx?react2markup';
import { markResponsiveTokens } from '~/utils/markResponsiveTokens';

const BreakpointsSection = () => {
    const { t } = useTranslation('home.css')
    const codeState = useState(codeOfResponsiveBreakpoints)
    return (
        <section className="p:50|10|0|10 p:120|40@md rel">
            <StylesHomeGridsBg />
            <div className="homeContainer">
                <h5 className="homeSubtitle f:pink-70">{t('Optimum layout')}</h5>
                <h2 className="homeTitle">{t('Responsive design. Have it anywhere.')}</h2>
                <p className="max-w:750">
                    <Trans i18nKey="$Breakpoints" t={t}>
                        With <b>10</b> responsive breakpoints: <code>@3xs~@4xl</code>, our presets are suitable for almost all situations and devices. You can use not only arbitrary breakpoints such as <code>font:32@&gt;=1234</code>, but also operators. For example&nbsp;
                    </Trans>
                    <code>text:center@&gt;=768&amp;&lt;1024</code> <Trans i18nKey="$Breakpoints1" t={t}>.</Trans>
                </p>
                <p className="max-w:750">
                    {t("Breakpoints apply to all styles, so that you can implement the most refined layout.")}
                </p>
                <StylesHomeLearnMore href="/docs/breakpoints">{t('Learn more about Breakpoints')}</StylesHomeLearnMore>
                <IFrame className="h:420" src="/examples/responsive-breakpoints"
                    onResize={(width: number) => {
                        markResponsiveTokens(codeState, codeOfResponsiveBreakpoints, width, ['grid-cols:[0-9]+', 'gap:[0-9]+']);
                    }} />
                <div className="mt:20 mx:-20@<md">
                    <Code lang="tsx" className="max-h:350 bb:0@<sm rb:0@<sm" lineNumbers>{codeState[0]}</Code>
                </div>
            </div>
        </section >
    )
}

export default BreakpointsSection