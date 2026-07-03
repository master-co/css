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
            <div className="abs inset:0 z:-3 background:var(--grid) opacity:.9" />
            <div
                className="abs inset:0 z:-2 pointer-events:none"
                style={{
                    background: [
                        'radial-gradient(980px circle at 50% 4%, rgb(250 204 21 / .16), transparent 60%)',
                        'linear-gradient(180deg, transparent 0%, var(--color-surface-base) 84%)'
                    ].join(',')
                }} />
            <div
                className="abs top:0 z:-2 h:36x opacity:.7 pointer-events:none inset-x:0"
                style={{
                    background: 'linear-gradient(90deg, transparent 8%, rgb(250 204 21 / .08), rgb(34 211 238 / .045), transparent 92%)'
                }} />
            <div className="app-wrapper max-w:breakpoint-2xl">
                <MotionDiv className="max-w:breakpoint-xl">
                    <h1 className="mx:0 mb:0 mt:xl font:5xl font:regular leading:.96 tracking:tighter text-balance text:strong font:9xl@md">
                        {t('The markup-driven')}<br></br>
                        {t('CSS language and framework')}
                    </h1>
                    <p className="max-w:72ch mb:0 mt:xl font:md leading:md text:muted text:xl@lg">
                        {t('for build interfaces that are readable by humans and reliable for agents.')}
                    </p>
                    <div className="flex flex-wrap gap:sm|md mt:2xl">
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
