import DroppedCode from '~/components/DroppedCode';

import Code from '~/components/Code';
import { Trans, useTranslation } from 'next-i18next';
import Image from 'next/image';

const EnhancedSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <>
            <h5 className="homeSubtitle f:purple-70 mt:120">{t('Enhanced')}</h5>
            <h3 className="homeTitle mb:20">
                <span className="inline-block v:middle my:-10 mr:5 ml:-5">
                    <Image width="48" height="48" src="/images/frown.png" alt="semantics" />
                </span>
                {t('Why not just inline styles?')}
            </h3>
            <p>
                <Trans i18nKey='$Enhanced' t={t}>
                    I want the button to be bigger at viewport width <code>&gt;=1024px</code> and then fade when disabled.
                </Trans>
            </p>
            {(() => {
                const code1 = /* html */ `
                    <button style="font-size: .875rem; text-align: center; height: 2.5rem;" disabled>${t('Oops...')}</button>
                `
                const code2 = /* html */ `
                    <button class="font:14 text:center height:40 height:56**@md** opacity:.5**[disabled]**" disabled>${t('Yeah!')}</button>
                `
                return (
                    <>
                        <Code lang="html" scrollbar={false} invalid>{code1}</Code>
                        <p className='max-w:750'>{t("Inline styles cannot apply selectors, media queries, and many CSS features. With Master CSS, you can now implement them with the most succinct syntax.")}</p>
                        <Code lang="html" scrollbar={false} valid>{code2}</Code>
                    </>
                )
            })()}
        </>
    )
}

export default EnhancedSection;