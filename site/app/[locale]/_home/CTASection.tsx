import { IconArrowRight, IconBrandGithub, IconTerminal2 } from '@tabler/icons-react'
import Link from '~/internal/components/Link'
import { MotionSection } from './HomeMotion'
import { homeInteractions, homeSections, type Translate } from './home-content'

export default function CTASection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.getStarted}
            id={homeSections.getStarted}
            className="home-section">
            <div className="home-section-wrap">
                <div className="rel overflow:hidden p:lg r:3xl outline:1px|solid|subtle surface:raised shadow:lg p:xl@md">
                    <div className="abs inset:0 opacity:.64 pointer-events:none"
                        style={{
                            background: [
                                'linear-gradient(135deg, rgb(250 204 21 / .10), transparent 46%)',
                                'linear-gradient(180deg, rgb(255 255 255 / .08), transparent 42%)'
                            ].join(',')
                        }} />
                    <div className="rel z:1 grid-cols:1 items-center gap:2xl grid-cols:12@lg gap:2xl@lg">
                        <div className="grid-col-span:7@lg home-section-copy">
                            <p className="home-section-label">{t('Get started')}</p>
                            <h2 className="home-section-heading">
                                {t('Start with one class string, then grow into a design system.')}
                            </h2>
                        </div>
                        <div className="flex flex-wrap justify-start gap:md grid-col-span:5@lg justify-end@lg">
                            <Link
                                data-home-interaction={homeInteractions.ctaLink}
                                href="/guide/introduction"
                                className="home-primary-action">
                                {t('Get started')}
                                <IconArrowRight className="size:4x ml:xs stroke:1.75" />
                            </Link>
                            <Link
                                data-home-interaction={homeInteractions.ctaLink}
                                href="/play"
                                className="home-secondary-action">
                                <IconTerminal2 className="size:4x mr:xs stroke:1.75" />
                                {t('Open Play')}
                            </Link>
                            <Link
                                data-home-interaction={homeInteractions.ctaLink}
                                href="https://github.com/master-co/css"
                                className="home-secondary-action">
                                <IconBrandGithub className="size:4x mr:xs stroke:1.75" />
                                GitHub
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </MotionSection>
    )
}
