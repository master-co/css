import clsx from 'clsx'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, homeBentoCardBodyClassName, homeBentoCardHeaderClassName, homeBentoCardTitleClassName, homeBentoVisualClassName } from './HomeBento'
import HomeCodeWindow, { type HomeCodeWindowProblem } from './HomeCodeWindow'
import { MotionSection } from './HomeMotion'
import { agentDiagnosticCards, homeSections, sectionBodyClassName, sectionHeadingClassName, sectionLabelClassName, type AgentDiagnosticCardContent, type Translate } from './home-content'

const invalidClassesCode = `
<!-- @ERROR font: -->
<button class="inline-flex px:md font: bg:blue-60">
  Save changes
</button>
`

const classOrderCode = `
<!-- @WARN bg:white font:md flex px:4x rel -->
<article class="bg:white font:md flex px:4x rel">
  Preview card
</article>
`

const conflictingClassesCode = `
<!-- @WARN m:0 -->
<section class="grid gap:md m:0 m:md">
  Settings
</section>
`

const canonicalUtilitiesCode = `
<!-- @WARN text-align:center --><!-- @WARN margin:md -->
<h2 class="text-align:center margin:md">
  Agent-ready UI
</h2>
`

const themeTokensCode = `
<!-- @WARN font:16px --><!-- @WARN fg:var(--color-red-60) -->
<p class="font:16px fg:var(--color-red-60)">
  Destructive action
</p>
`

const safeFixPreviewCode = `
preview home.html
- class="bg:white font:md flex px:4x rel"
+ class="rel flex px:4x font:md bg:white"
`

export default function AgentDiagnosticsSection({ t }: { t: Translate }) {
    return (
        <MotionSection
            homeSection={homeSections.codeDiagnostics}
            id={homeSections.codeDiagnostics}
            className="py:5xl">
            <div className="app-wrapper max-w:breakpoint-2xl">
                <div className="max-w:breakpoint-md">
                    <p className={sectionLabelClassName}>{t('Code diagnostics')}</p>
                    <h2 className={sectionHeadingClassName}>
                        {t('Give agents the same feedback your team trusts.')}
                    </h2>
                    <p className={sectionBodyClassName}>
                        {t('Project-aware scans, class diagnostics, generated CSS inspection, and safe fix previews make AI styling changes reviewable before they land.')}
                    </p>
                </div>

                <DiagnosticVisual t={t} />
            </div>
        </MotionSection>
    )
}

function DiagnosticVisual({ t }: { t: Translate }) {
    return (
        <HomeBentoFrame>
            <HomeBentoGrid className="grid-cols:1 grid-cols:2@md grid-cols:3@lg">
                {agentDiagnosticCards.map((card) => (
                    <DiagnosticCard card={card} key={card.title} t={t} />
                ))}
            </HomeBentoGrid>
        </HomeBentoFrame>
    )
}

function DiagnosticCard({ card, t }: { card: AgentDiagnosticCardContent; t: Translate }) {
    return (
        <HomeBentoCard>
            <div className={homeBentoCardHeaderClassName}>
                <h3 className={homeBentoCardTitleClassName}>
                    {t(card.title)}
                </h3>
                <p className={homeBentoCardBodyClassName}>{t(card.body)}</p>
            </div>

            {card.visual === 'invalid-classes' ? (
                <InvalidClassesCodeWindow t={t} />
            ) : card.visual === 'class-order' ? (
                <ClassOrderCodeWindow t={t} />
            ) : card.visual === 'conflicting-classes' ? (
                <ConflictingClassesCodeWindow t={t} />
            ) : card.visual === 'canonical-utilities' ? (
                <CanonicalUtilitiesCodeWindow t={t} />
            ) : card.visual === 'theme-tokens' ? (
                <ThemeTokensCodeWindow t={t} />
            ) : (
                <SafeFixPreviewCodeWindow t={t} />
            )}
        </HomeBentoCard>
    )
}

function InvalidClassesCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'invalid-class',
        location: 'home.html:1:31',
        message: t('Invalid value for `font` property.'),
        severity: 'error',
        source: '@master/css/no-invalid-classes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {invalidClassesCode}
        </HomeCodeWindow>
    )
}

function ClassOrderCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'invalid-class-order',
        location: 'home.html:1:16',
        message: t('No consistent class order followed.'),
        severity: 'warning',
        source: '@master/css/sort-classes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {classOrderCode}
        </HomeCodeWindow>
    )
}

function ConflictingClassesCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'conflicting-class',
        location: 'home.html:1:28',
        message: t('"m:0" is overridden by "m:md".'),
        severity: 'warning',
        source: '@master/css/no-conflicting-classes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {conflictingClassesCode}
        </HomeCodeWindow>
    )
}

function CanonicalUtilitiesCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'prefer-canonical-class',
        location: 'home.html:1:12',
        message: t('Prefer `text-center` and `m:md`.'),
        severity: 'warning',
        source: '@master/css/prefer-canonical-classes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {canonicalUtilitiesCode}
        </HomeCodeWindow>
    )
}

function ThemeTokensCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'prefer-canonical-class',
        location: 'home.html:1:10',
        message: t('Prefer theme tokens for matching raw values.'),
        severity: 'warning',
        source: '@master/css/prefer-canonical-classes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {themeTokensCode}
        </HomeCodeWindow>
    )
}

function SafeFixPreviewCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [{
        code: 'preview-ready',
        location: 'home.html',
        message: t('Preview created for review.'),
        severity: 'info',
        source: 'mastercss_preview_fixes'
    }]

    return (
        <HomeCodeWindow
            className={clsx(homeBentoVisualClassName)}
            lang="bash"
            problems={problems}
            problemsLabel={t('Preview')}
            variant="embedded">
            {safeFixPreviewCode}
        </HomeCodeWindow>
    )
}
