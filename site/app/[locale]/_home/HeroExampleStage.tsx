import { heroExampleCode, type Translate } from './home-content'
import HomeCodeWindow from './HomeCodeWindow'

export default function HeroExampleStage({ t }: { t: Translate }) {
    return (
        <div className="rel overflow:hidden r:3xl outline:1px|solid|subtle surface:raised shadow:lg">
            <div className="abs inset:0 z:0 pointer-events:none"
                style={{
                    background: [
                        'linear-gradient(180deg, rgb(255 255 255 / .10), transparent 26%)',
                        'radial-gradient(760px circle at 78% 34%, rgb(250 204 21 / .12), transparent 58%)'
                    ].join(',')
                }} />
            <div className="rel z:1 grid-cols:1 gap:0 grid-cols:12@lg">
                <HomeCodeWindow
                    className="grid-col-span:7@lg"
                    lang="html"
                    preClassName="min-h:76x"
                    variant="embedded">
                    {heroExampleCode}
                </HomeCodeWindow>

                <div className="p:md bg:surface-muted/.24 grid-col-span:5@lg p:xl@lg bl:1px|solid|subtle@lg">
                    <div className="grid h:full min-h:2xs content:center">
                        <article className="grid gap:lg p:lg r:3xl outline:1px|solid|subtle surface:raised shadow:xs">
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
