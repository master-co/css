import { useTranslation } from 'next-i18next';
import Code from '~/components/Code';
import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore';
import ADynamicallyAssignedValue from './ADynamicallyAssignedValue';
import ConditionallyApplyClassNames from './ConditionallyApplyClassNames';

const FlexibilitySection = () => {
    const { t } = useTranslation('home.css')
    return (
        <>
            <section id="flexibility" className="p:50|10|0|10 p:120|40|0|40@md">
                <div className="homeContainer">
                    <h5 className="homeSubject f:teal-70">
                        <hr className='homeHrLeft' />
                        <span>{t('Flexibility')}</span>
                        <hr className='homeHrRight' />
                    </h5>
                    <h2 className="f:30 f:48@md f:extrabold ls:-.25 t:center">{t('Awaken CSS in HTML and JS.')}</h2>
                    <p className="t:18 t:24@md t:center">{t('Accomplish more with more flexibility.')}</p>
                </div>
            </section>
            <section className="p:50|10 p:120|40@md rel">
                <StylesHomeGridsBg />
                <ADynamicallyAssignedValue />
                <ConditionallyApplyClassNames />
            </section>
        </>
    )
}

export default FlexibilitySection;