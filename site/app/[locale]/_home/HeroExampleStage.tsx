import Code from '~/internal/components/Code'
import WindowControls from '~/internal/components/WindowControls'
import { heroExampleCode, type Translate } from './home-content'

export default function HeroExampleStage({ t }: { t: Translate }) {
    return (
        <div className="rel overflow:hidden b:1px|solid|subtle r:3xl surface:raised shadow:card">
            <div className="abs inset:0 z:0 pointer-events:none"
                style={{
                    background: [
                        'linear-gradient(180deg, rgb(255 255 255 / .10), transparent 26%)',
                        'radial-gradient(760px circle at 78% 34%, rgb(250 204 21 / .12), transparent 58%)'
                    ].join(',')
                }} />
            <div className="rel z:1 grid-cols:1 gap:0 grid-cols:12@lg">
                <div className="grid-col-span:7@lg">
                    <div className="flex items-center justify-between gap:md px:md py:sm bb:1px|solid|subtle bg:surface-base/.72 backdrop-filter:blur(18px)">
                        <div className="flex items-center gap:sm">
                            <WindowControls />
                            <span className="font:xs text:muted">index.html</span>
                        </div>
                        <span className="font:xs text:muted">{t('Structured syntax')}</span>
                    </div>
                    <div className="rel p:xs p:sm@md">
                        <Code
                            className="{min-h:76x}_pre {r:xl}_pre {font:12px}_pre"
                            lang="html">
                            {heroExampleCode}
                        </Code>
                        <span className="abs bottom:lg right:lg h:4x w:2px r:md bg:yellow animate:pulse pointer-events:none" />
                    </div>
                </div>

                <div className="p:md bg:surface-muted/.24 grid-col-span:5@lg p:xl@lg bl:1px|solid|subtle@lg">
                    <div className="grid h:full min-h:2xs content:center">
                        <article className="grid gap:lg p:lg b:1px|solid|subtle r:3xl surface:raised shadow:xs">
                            <div className="flex items-center justify-between gap:md">
                                <p className="m:0 font:sm text:muted">{t('Design system surface')}</p>
                                <span className="inline-flex items-center h:6x px:xs r:lg font:xs bg:yellow/.14 text:strong">{t('Preview')}</span>
                            </div>
                            <div>
                                <h2 className="m:0 font:2xl font:regular leading:xs text:strong">{t('Agent-ready UI')}</h2>
                                <p className="max-w:34ch mb:0 mt:sm font:sm leading:md text:muted">
                                    {t('Semantic classes describe the interface before CSS is generated.')}
                                </p>
                            </div>
                            <button className="justify-self:start px:md py:sm b:0 r:xl font:medium bg:yellow fg:yellow-95">
                                {t('Ship interface')}
                            </button>
                            <div className="grid-cols:3 gap:xs pt:sm bt:1px|solid|subtle">
                                <HeroDemoSignal label={t('Theme tokens')} />
                                <HeroDemoSignal label={t('Semantic surface')} />
                                <HeroDemoSignal label={t('Reliable output')} />
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    )
}

function HeroDemoSignal({ label }: { label: string }) {
    return (
        <div className="grid gap:xs">
            <span className="h:1.5x r:md bg:yellow" />
            <span className="font:xs leading:1.25 text:muted">{label}</span>
        </div>
    )
}
