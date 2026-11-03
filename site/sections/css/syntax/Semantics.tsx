import DroppedCode from '~/components/DroppedCode';
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';

import Code from '~/components/Code';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';

const SemanticsSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <>
            <h5 className="homeSubtitle f:purple-70 mt:120">{t('Semantics')}</h5>
            <h3 className="homeTitle mb:20">
                <span className="inline-block v:middle my:-10 mr:5 ml:-5">
                    <Image width="48" height="48" src="/images/crying.png" alt="semantics" />
                </span>
                {t('Writing CSS in class attributes feels weird?')}
            </h3>
            <p>
                {t('Our intention isn\'t to let you write CSS directly, but you can still do it.')}
            </p>
            {(() => {
                const code1 = /* html */ `
                            <a class="display:block font-style:italic aspect:1/1 border-radius:50% width:100% height:100% position:relative visibility:invisible isolation:isolate"></a>
                        `
                const code2 = /* html */ `
                            <a class="**block** **italic** **square** **round** **full** **rel** **invisible** **isolate**"></a>
                        `
                return (
                    <>
                        <Code lang="html" scrollbar={false}>{code1}</Code>
                        <p>{t('Try using more sensible semantics.')} <DroppedCode p1={code1} p2={code2} target="class" t={t} /></p>
                        <Code lang="html" scrollbar={false} valid>{code2}</Code>
                    </>
                )
            })()}
        </>
    )
}

export default SemanticsSection;