import DroppedCode from '~/components/DroppedCode';

import Code from '~/components/Code';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';

const GroupSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <>
            <h5 className="homeSubtitle f:purple-70 mt:120">{t('Groups')}</h5>
            <h3 className="homeTitle mb:20">
                <span className="inline-block v:middle my:-10 mr:5 ml:-5 scale(.95)">
                    <Image width="48" height="48" src="/images/star-eye.png" alt="group feature" />
                </span>
                {t('So cool, it\'s a group feature!')}
            </h3>
            {(() => {
                const code1 = /* html */ `
                            <ul class="block**>li:hover@md** p:16**>li:hover@md** w:full**>li:hover@md** text:center**>li:hover@md** font:blue/.5**>li:hover@md**"></ul>
                        `
                const code2 = /* html */ `
                            <ul class="{block;p:16;w:full;text:center;font:blue/.5}**>li:hover@md**"></ul>
                        `
                return (
                    <>
                        <Code lang="html" scrollbar={false}>{code1}</Code>
                        <p>{t("DRY (Don't Repeat Yourself) up and make your CSS more readable.")} <DroppedCode p1={code1} p2={code2} target="class" t={t} /></p>
                        <Code lang="html" scrollbar={false} valid>{code2}</Code>
                    </>
                )
            })()}
        </>
    )
}

export default GroupSection;