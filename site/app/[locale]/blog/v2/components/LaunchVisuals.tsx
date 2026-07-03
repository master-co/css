import type { ComponentType, ReactNode } from 'react'
import {
    IconBrandCss3,
    IconChartBar,
    IconCircleCheck,
    IconClipboardText,
    IconDeviceDesktop,
    IconFileText,
    IconInfoCircle,
    IconSourceCode,
    IconTestPipe,
    IconWand,
} from '@tabler/icons-react'
import clsx from 'clsx'
import Demo from 'internal/components/Demo'
import DemoLabel from 'internal/components/DemoLabel'
import DemoPanel from 'internal/components/DemoPanel'

type IconComponent = ComponentType<{
    className?: string
    strokeWidth?: number
}>

type VisualShellProps = {
    children: ReactNode
    description: string
    eyebrow: string
    Icon: IconComponent
    title: string
}

const accentClasses = {
    blue: 'bg:blue-60/.12 fg:blue-60',
    cyan: 'bg:cyan-60/.12 fg:cyan-60',
    green: 'bg:green-60/.12 fg:green-60',
    yellow: 'bg:amber-50/.16 fg:amber-60',
}

const codeLines = [
    "@import '@master/css';",
    '@theme { --color-brand: ... }',
    '@theme dark { --color-surface: ... }',
    '@components { btn { @compose ... } }',
    '@utilities { content-grid { ... } }',
]

const launchCards = [
    {
        Icon: IconBrandCss3,
        accent: accentClasses.blue,
        title: 'CSS entry',
        text: 'Tokens, modes, components, utilities, variants, and keyframes start in the stylesheet.',
    },
    {
        Icon: IconDeviceDesktop,
        accent: accentClasses.green,
        title: 'Rendering modes',
        text: 'Runtime, static, pre-render, and progressive delivery share the same authoring model.',
    },
    {
        Icon: IconWand,
        accent: accentClasses.yellow,
        title: 'Agent tooling',
        text: 'Language tools, lint diagnostics, MCP inspection, and safe previews stay project-aware.',
    },
]

const graphColumns = [
    {
        Icon: IconBrandCss3,
        accent: accentClasses.blue,
        title: 'CSS entry',
        items: ['@import', '@theme', '@custom-variant', '@components', '@utilities'],
    },
    {
        Icon: IconFileText,
        accent: accentClasses.cyan,
        title: 'Manifest',
        items: ['tokens', 'modes', 'variants', 'components', 'keyframes'],
    },
    {
        Icon: IconChartBar,
        accent: accentClasses.green,
        title: 'Layered CSS',
        items: ['theme', 'base', 'defaults', 'components', 'utilities'],
    },
    {
        Icon: IconSourceCode,
        accent: accentClasses.yellow,
        title: 'Markup usage',
        items: ['btn', 'bg:brand', 'grid-cols:2@md', 'animation:reveal'],
    },
]

const modeRows = [
    {
        name: 'runtime',
        accent: 'bg:blue-60/.12 fg:blue-60',
        description: 'Browser generation for dynamic interfaces.',
        active: ['Author', 'Render', 'Hydrate', 'Inspect'],
    },
    {
        name: 'static',
        accent: 'bg:green-60/.12 fg:green-60',
        description: 'Source scan to a CSS asset at build time.',
        active: ['Author', 'Resolve', 'Render', 'Inspect'],
    },
    {
        name: 'pre-render',
        accent: 'bg:cyan-60/.12 fg:cyan-60',
        description: 'HTML-shaped CSS for build or server output.',
        active: ['Author', 'Resolve', 'Render', 'Inspect'],
    },
    {
        name: 'progressive',
        accent: 'bg:amber-50/.16 fg:amber-60',
        description: 'First-response CSS, then runtime adoption.',
        active: ['Author', 'Resolve', 'Render', 'Hydrate', 'Inspect'],
    },
]

const phases = ['Author', 'Resolve', 'Render', 'Hydrate', 'Inspect']

const agentSteps = [
    {
        Icon: IconInfoCircle,
        accent: accentClasses.blue,
        title: 'Language Service',
        label: 'Project vocabulary',
    },
    {
        Icon: IconTestPipe,
        accent: accentClasses.green,
        title: 'ESLint',
        label: 'Diagnostics',
    },
    {
        Icon: IconWand,
        accent: accentClasses.yellow,
        title: 'MCP inspection',
        label: 'Manifest queries',
    },
    {
        Icon: IconClipboardText,
        accent: accentClasses.cyan,
        title: 'Generated CSS preview',
        label: 'Resolved rules',
    },
    {
        Icon: IconCircleCheck,
        accent: accentClasses.green,
        title: 'Safe fix preview',
        label: 'Reviewable patch',
    },
]

function VisualShell({ children, description, eyebrow, Icon, title }: VisualShellProps) {
    return (
        <Demo className="container w:full my:xl">
            <DemoPanel $p={0} className="overflow:hidden w:full">
                <div className="p:md p:lg@container(3xs)">
                    <div className="flex flex-col gap:xs mb:lg">
                        <DemoLabel className="items-center gap:2xs mb:0">
                            <Icon className="size:4x stroke:1.75" />
                            {eyebrow}
                        </DemoLabel>
                        <h3 className="m:0 font:2xl font:heavy leading:xs text:strong font:3xl@container(3xs)">
                            {title}
                        </h3>
                        <p className="max-w:breakpoint-sm m:0 text:sm text:muted">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </DemoPanel>
        </Demo>
    )
}

function IconTile({ Icon, accent }: { Icon: IconComponent, accent: string }) {
    return (
        <div className={clsx('grid flex:0|0|auto place-content:center size:10x r:lg', accent)}>
            <Icon className="size:5x stroke:1.75" />
        </div>
    )
}

function MiniPanel({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={clsx('b:1px|solid|base r:lg surface:raised shadow:xs', className)}>
            {children}
        </div>
    )
}

export function ReleaseSystemPreview() {
    return (
        <VisualShell
            description="One project stylesheet drives the design vocabulary, the rendering path, and the tooling surface that humans and agents inspect."
            eyebrow="Launch dashboard"
            Icon={IconChartBar}
            title="One release system, from stylesheet to agent preview"
        >
            <div className="grid grid-cols:1 gap:sm grid-cols:3@container(md)">
                <MiniPanel className="grid-col-span:1 p:sm grid-col-span:2@container(md)">
                    <div className="flex items-center justify-between gap:md mb:sm">
                        <div className="min-w:0">
                            <div className="font:semibold font:sm text:strong">app.css</div>
                            <div className="mt:2xs font:xs text:muted">Stylesheet-authored system</div>
                        </div>
                        <IconTile Icon={IconBrandCss3} accent={accentClasses.blue} />
                    </div>
                    <pre className="overflow:hidden m:0 p:sm r:md font:xs leading:lg bg:surface-base text:muted">
                        {codeLines.map((line) => (
                            <code className="block overflow:hidden text-ellipsis white-space:nowrap" key={line}>
                                {line}
                            </code>
                        ))}
                    </pre>
                </MiniPanel>

                <div className="grid gap:sm">
                    <MiniPanel className="p:sm">
                        <div className="flex items-center gap:sm mb:sm">
                            <IconTile Icon={IconDeviceDesktop} accent={accentClasses.green} />
                            <div>
                                <div className="font:semibold font:sm text:strong">Rendering modes</div>
                                <div className="mt:2xs font:xs text:muted">Same vocabulary</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap:xs">
                            {['runtime', 'static', 'pre-render', 'progressive'].map((mode) => (
                                <span className="px:xs py:2xs r:sm font:mono font:xs bg:green-60/.10 fg:green-60" key={mode}>
                                    {mode}
                                </span>
                            ))}
                        </div>
                    </MiniPanel>

                    <MiniPanel className="p:sm">
                        <div className="flex items-center gap:sm mb:sm">
                            <IconTile Icon={IconWand} accent={accentClasses.yellow} />
                            <div>
                                <div className="font:semibold font:sm text:strong">Agent tooling</div>
                                <div className="mt:2xs font:xs text:muted">Inspectable changes</div>
                            </div>
                        </div>
                        <div className="grid gap:2xs">
                            {['Language Service', 'ESLint', 'MCP', 'Safe preview'].map((tool) => (
                                <div className="flex items-center gap:xs min-w:0" key={tool}>
                                    <span className="size:2x round bg:amber-50"></span>
                                    <span className="line-clamp:1 font:xs text:strong">{tool}</span>
                                </div>
                            ))}
                        </div>
                    </MiniPanel>
                </div>
            </div>

            <div className="grid grid-cols:1 gap:sm mt:sm grid-cols:3@container(3xs)">
                {launchCards.map(({ Icon, accent, text, title }) => (
                    <MiniPanel className="p:sm" key={title}>
                        <div className="flex items-start gap:sm">
                            <IconTile Icon={Icon} accent={accent} />
                            <div className="min-w:0">
                                <div className="font:semibold font:sm text:strong">{title}</div>
                                <p className="mx:0 mb:0 mt:2xs font:xs leading:md text:muted">{text}</p>
                            </div>
                        </div>
                    </MiniPanel>
                ))}
            </div>
        </VisualShell>
    )
}

export function StylesheetGraphDemo() {
    return (
        <VisualShell
            description="The v2 stylesheet is read as a CSS entry graph, resolved into manifest inputs, emitted into stable layers, then used from markup."
            eyebrow="CSS entry graph"
            Icon={IconBrandCss3}
            title="Stylesheet authoring becomes a graph the toolchain can inspect"
        >
            <div className="grid grid-cols:1 gap:sm grid-cols:4@container(md)" role="img" aria-label="CSS entry graph from stylesheet to manifest, layered CSS, and markup usage">
                {graphColumns.map(({ Icon, accent, items, title }, index) => (
                    <MiniPanel className="rel overflow:hidden min-h:42x p:sm" key={title}>
                        <div className="flex items-center gap:sm">
                            <IconTile Icon={Icon} accent={accent} />
                            <div className="min-w:0">
                                <div className="font:mono font:xs text:muted">0{index + 1}</div>
                                <div className="font:semibold font:sm text:strong">{title}</div>
                            </div>
                        </div>
                        <div className="grid gap:xs mt:md">
                            {items.map((item) => (
                                <div className="px:xs py:2xs r:sm font:xs surface:muted text:strong" key={item}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </MiniPanel>
                ))}
            </div>

            <div className="grid grid-cols:1 gap:sm mt:sm grid-cols:3@container(3xs)">
                <MiniPanel className="p:sm">
                    <DemoLabel>Author</DemoLabel>
                    <div className="font:sm text:strong">CSS entry</div>
                    <p className="mx:0 mb:0 mt:2xs font:xs text:muted">Design decisions stay in stylesheets.</p>
                </MiniPanel>
                <MiniPanel className="p:sm">
                    <DemoLabel>Resolve</DemoLabel>
                    <div className="font:sm text:strong">Manifest</div>
                    <p className="mx:0 mb:0 mt:2xs font:xs text:muted">Tools read a deterministic vocabulary.</p>
                </MiniPanel>
                <MiniPanel className="p:sm">
                    <DemoLabel>Render</DemoLabel>
                    <div className="font:sm text:strong">Layered CSS</div>
                    <p className="mx:0 mb:0 mt:2xs font:xs text:muted">Used classes become ordered rules.</p>
                </MiniPanel>
            </div>
        </VisualShell>
    )
}

export function RenderingModesChart() {
    return (
        <VisualShell
            description="Each mode uses the same stylesheet-authored vocabulary, but moves the resolve, render, and hydrate work to the place that fits the app."
            eyebrow="Mode chart"
            Icon={IconDeviceDesktop}
            title="Four rendering modes, one authoring model"
        >
            <div className="grid gap:sm" role="img" aria-label="Qualitative rendering mode chart with author, resolve, render, hydrate, and inspect phases">
                {modeRows.map((mode) => (
                    <MiniPanel className="p:sm" key={mode.name}>
                        <div className="grid grid-cols:1 gap:sm grid-cols:6@container(md)">
                            <div className="grid-col-span:1">
                                <div className={clsx('inline-flex px:xs py:2xs r:sm font:mono font:xs', mode.accent)}>
                                    {mode.name}
                                </div>
                                <p className="mx:0 mb:0 mt:xs font:xs leading:md text:muted">
                                    {mode.description}
                                </p>
                            </div>
                            <div className="grid grid-cols:2 gap:xs grid-cols:5@container(2xs) grid-col-span:5@container(md)">
                                {phases.map((phase) => {
                                    const active = mode.active.includes(phase)

                                    return (
                                        <div
                                            className={clsx(
                                                'flex items-center justify-center min-h:12x px:xs py:sm b:1px|solid|base r:md font:medium font:xs text:center',
                                                active ? 'surface:raised text:strong' : 'surface:muted text:muted'
                                            )}
                                            key={phase}
                                        >
                                            {phase}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </MiniPanel>
                ))}
            </div>
        </VisualShell>
    )
}

export function AgentWorkflowDemo() {
    return (
        <VisualShell
            description="The agent path is intentionally reviewable: inspect the project, resolve the class, preview the CSS, then propose a fix."
            eyebrow="Agentic workflow"
            Icon={IconWand}
            title="Agent-assisted styling works when every step is inspectable"
        >
            <div className="grid grid-cols:1 gap:sm grid-cols:5@container(md)" role="img" aria-label="Agent workflow from language service through ESLint, MCP inspection, generated CSS preview, and safe fix preview">
                {agentSteps.map(({ Icon, accent, label, title }, index) => (
                    <MiniPanel className="min-h:40x p:sm" key={title}>
                        <div className="flex items-center justify-between gap:sm">
                            <IconTile Icon={Icon} accent={accent} />
                            <span className="font:mono font:xs text:muted">0{index + 1}</span>
                        </div>
                        <div className="mt:md font:semibold font:sm leading:sm text:strong">
                            {title}
                        </div>
                        <p className="mx:0 mb:0 mt:2xs font:xs leading:md text:muted">
                            {label}
                        </p>
                    </MiniPanel>
                ))}
            </div>

            <div className="grid grid-cols:1 gap:sm mt:sm grid-cols:2@container(3xs)">
                <MiniPanel className="p:sm">
                    <DemoLabel>Inspect</DemoLabel>
                    <pre className="overflow:hidden m:0 p:sm r:md font:xs leading:lg bg:surface-base text:muted">
                        <code className="block overflow:hidden text-ellipsis white-space:nowrap">
                            class="btn bg:brand bg:brand/.85:hover"
                        </code>
                        <code className="block overflow:hidden text-ellipsis white-space:nowrap">
                            -&gt; color tokens, hover state, component compose
                        </code>
                    </pre>
                </MiniPanel>
                <MiniPanel className="p:sm">
                    <DemoLabel>Safe preview</DemoLabel>
                    <pre className="overflow:hidden m:0 p:sm r:md font:xs leading:lg bg:surface-base text:muted">
                        <code className="block overflow:hidden text-ellipsis white-space:nowrap">
                            .bg\:brand\:\hover:hover {'{'} ... {'}'}
                        </code>
                        <code className="block overflow:hidden text-ellipsis white-space:nowrap">
                            patch: canonical order, no hidden config
                        </code>
                    </pre>
                </MiniPanel>
            </div>
        </VisualShell>
    )
}
