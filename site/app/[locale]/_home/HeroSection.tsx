import { IconArrowRight, IconTerminal2 } from '@tabler/icons-react'
import clsx from 'clsx'
import Link from '~/internal/components/Link'
import HeroExampleStage from './HeroExampleStage'
import { MotionDiv } from './HomeMotion'
import { homeSections, sectionLabelClassName, type Translate } from './home-content'

export default function HeroSection({ t }: { t: Translate }) {
    return (
        <section
            data-home-section={homeSections.hero}
            id={homeSections.hero}
            className="rel overflow:hidden isolate py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <MotionDiv className="max-w:breakpoint-xl text-center">
                    <h1 className="mx:0 mb:0 mt:xl font:5xl font:light leading:.96 tracking:tight text-balance text:strong font:9xl@md">
                        {t('The markup-driven CSS language and framework')}<br></br>
                    </h1>
                    <p className="mb:0 mt:xl font:md leading:md text:muted text:xl@lg">
                        {t('for build interfaces that are readable by humans and reliable for agents.')}
                    </p>
                    <div className="flex flex-wrap gap:sm|md w:fit mx:auto mt:2xl">
                        <Link href="/guide/introduction" className="btn btn-lg touch-yellow r:md outline-offset:2xs text-decoration:none bg:yellow fg:yellow-95 outline:2px|solid|yellow:focus-visible">
                            {t('Get started')}
                            <IconArrowRight className="size:4x ml:xs stroke:1.75" />
                        </Link>
                        <Link href="/play" className="app-object btn btn-lg app-object-interactive r:md outline-offset:2xs outline:2px|solid|yellow:focus-visible">
                            <IconTerminal2 className="size:4x mr:xs stroke:1.75" />
                            {t('Open Play')}
                        </Link>
                    </div>
                </MotionDiv>
                <MotionDiv className="mt:3xl mt:4xl@md" delay={0.12}>
                    <HeroExampleStage t={t} />
                </MotionDiv>
            </div>
        </section>
    )
}
