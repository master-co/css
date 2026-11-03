import StylesHomeGridsBg from '~/components/StylesHomeGridsBg';
// @ts-ignore
import { Trans, useTranslation } from 'next-i18next';
import { frameworks } from '~/data/frameworks';
import clsx from 'clsx';
import ArrowForwardSvg from '~/svgs/arrow-forward.svg';
import { buildTools } from '~/data/build-tools';
import Link from '~/components/Link';
import ALink from '~/components/ALink';

const SetupSection = () => {
    const { t } = useTranslation('home.css')
    return (
        <section id="setup" className="py:50 py:120@md rel" style={{
            'backgroundImage': 'radial-gradient(rgba(255,255,255,.1) 1px,transparent 1px)',
            'backgroundPosition': '50% 100%',
            'backgroundSize': '25px 25px'
        }}>
            <div className="max-w:900 px:30 px:40@md mx:auto t:center">
                <h2 className="f:40 f:56@md f:heavy ls:-.25 lh:1">{t('One language. Anywhere.')}</h2>
                <p className="block text:center text:18 text:24@md">{t('Get started with your frameworks or build tools.')}</p>
            </div>
            <div className="homeContainer mt:50">
                <div className="
                       grid-cols:2 grid-cols:3@xs grid-cols:4@sm grid-cols:6@md
                    ">
                    {
                        frameworks.concat(buildTools).map((guide) =>
                            <ALink className="homeSetupBtn" href={'/docs/setup/' + guide.name.toLowerCase().replace(/ /g, '-').replace(/\./g, '')} key={guide.name}>
                                <guide.Logo className={clsx(guide.class, 'w:48 h:48 w:64@md h:64@md')} />
                                <div className="mt:10 font:12 font:14@md">{guide.name}</div>
                            </ALink>
                        )
                    }
                    <ALink className="homeSetupBtn" href={'/docs/setup'}>
                        <ArrowForwardSvg width="48" hieght="48" className="fill:gray-40" />
                    </ALink>
                </div>
            </div>
        </section>
    )
}

export default SetupSection;