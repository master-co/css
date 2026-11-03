import DroppedCode from '~/components/DroppedCode';

import Code from '~/components/Code';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';

const ShorthandsSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <>
            <h5 className="homeSubtitle f:purple-70 mt:120">{t('Shorthands')}</h5>
            <h2 className="homeTitle mb:20">
                <span className="inline-block v:middle my:-10 mr:5 ml:-5">
                    <Image width="48" height="48" src="/images/shocked.png" alt="semantics" />
                </span>
                {t('Class attributes get too long?')}
            </h2>
            {(() => {
                const code1 = /* html */ `
                            <a class="animation-name:fade animation-duration:1s animatino-timing-function:ease transition-property:opacity transition-duration:.3s margin-top:1rem margin-bottom:1rem margin-right:2rem margin-left:2.5rem"></a>
                        `
                const code2 = /* html */ `
                            <a class="animation:fade|1s|ease transition:opacity|.3s margin:16|32|16|40"></a>
                        `
                const code3 = /* html */ `
                            <a class="**@fade|1s|ease** **~opacity|.3s** **m:16|32|16|40**"></a>
                        `
                return (
                    <>
                        <Code lang="html" scrollbar={false}>{code1}</Code>
                        <p>{t('Try rewriting in shorthand.')} <DroppedCode p1={code1} p2={code2} t={t} /></p>
                        <Code lang="html" scrollbar={false}>{code2}</Code>
                        <p>{t('and with recommended symbols and acronyms.')} <DroppedCode p1={code1} p2={code3} target="class" t={t} /></p>
                        <Code lang="html" scrollbar={false} valid>{code3}</Code>
                    </>
                )
            })()}
        </>
    )
}

export default ShorthandsSection;