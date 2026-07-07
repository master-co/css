import { IconArrowRight, IconBrandGithub, IconTerminal2 } from '@tabler/icons-react'
import Link from '~/internal/components/Link'
import { MotionSection } from './HomeMotion'
import { homeInteractions, homeSections, sectionHeadingClassName, sectionLabelClassName, type Translate } from './home-content'

export default function CTASection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.getStarted}
            id={homeSections.getStarted}
            className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="rel overflow:hidden p:lg b:1px|solid|subtle r:3xl surface:raised shadow:card p:xl@md">
                    <div className="abs inset:0 opacity:.64 pointer-events:none"
                        style={{
                            background: [
                                'linear-gradient(135deg, rgb(250 204 21 / .10), transparent 46%)',
                                'linear-gradient(180deg, rgb(255 255 255 / .08), transparent 42%)'
                            ].join(',')
                        }} />
                    <div className="rel z:1 grid-cols:1 items-center gap:2xl grid-cols:12@lg gap:2xl@lg">
                        <div className="max-w:breakpoint-md grid-col-span:7@lg">
                            <p className={sectionLabelClassName}>{t('Get started')}</p>
                            <h2 className={sectionHeadingClassName}>
                                {t('Start with one class string, then grow into a design system.')}
                            </h2>
                        </div>
                        <div className="flex flex-wrap justify-start gap:md grid-col-span:5@lg justify-end@lg">
                            <Link
                                data-home-interaction={homeInteractions.ctaLink}
                                href="/guide/introduction"
                                className="btn btn-lg touch-yellow r:xl outline-offset:2xs text-decoration:none bg:yellow fg:yellow-95 outline:2px|solid|yellow:focus-visible">
                                {t('Get started')}
                                <IconArrowRight className="size:4x ml:xs stroke:1.75" />
                            </Link>
                            <Link
                                data-home-interaction={homeInteractions.ctaLink}
                                href="/play"
                                className="app-object btn btn-lg app-object-interactive r:xl outline-offset:2xs outline:2px|solid|yellow:focus-visible">
                                <IconTerminal2 className="size:4x mr:xs stroke:1.75" />
                                {t('Open Play')}
                            </Link>
                            <Link
                                data-home-interaction={homeInteractions.ctaLink}
                                href="https://github.com/master-co/css"
                                className="app-object btn btn-lg app-object-interactive r:xl outline-offset:2xs outline:2px|solid|yellow:focus-visible">
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
