import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid } from './HomeBento'
import HomeCodeWindow, { type HomeCodeWindowProblem } from './HomeCodeWindow'
import { MotionSection } from './HomeMotion'
import { agentDiagnosticCards, homeSections, type AgentDiagnosticCardContent, type Translate } from './home-content'

const invalidClassesCode = `
<!-- @ERROR text-decoration:bad() -->
<button class="inline-flex px:md text-decoration:bad()">
  Save changes
</button>
`

const classOrderCode = `
<!-- @WARN bg:white font:md flex px:4x rel -->
<article class="bg:white font:md flex px:4x rel">
  Preview card
</article>
`

const classOrderFixPreviewCode = `
<article class="rel flex px:4x font:md bg:white">
  Preview card
</article>
`

const conflictingClassesCode = `
<!-- @WARN m:0 -->
<section class="grid gap:md m:0 m:md">
  Settings
</section>
`

const conflictingClassesFixPreviewCode = `
<section class="grid gap:md m:md">
  Settings
</section>
`

const canonicalUtilitiesCode = `
<!-- @WARN text-align:center --><!-- @WARN margin:md -->
<h2 class="text-align:center margin:md">
  Agent-ready UI
</h2>
`

const canonicalUtilitiesFixPreviewCode = `
<h2 class="text-center m:md">
  Agent-ready UI
</h2>
`

const themeTokensCode = `
<!-- @WARN font:16px --><!-- @WARN fg:var(--color-red-60) -->
<p class="font:16px fg:var(--color-red-60)">
  Destructive action
</p>
`

const themeTokensFixPreviewCode = `
<p class="font:md fg:red-60">
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
            className="home-section">
            <div className="home-section-wrap">
                <div className="home-section-copy">
                    <p className="home-section-label">{t('Code diagnostics')}</p>
                    <h2 className="home-section-heading">
                        {t('Team-trusted diagnostics for agents.')}
                    </h2>
                    <p className="home-section-body">
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
            <div className="home-bento-card-header">
                <h3 className="home-bento-card-title">
                    {t(card.title)}
                </h3>
                <p className="home-bento-card-body">{t(card.body)}</p>
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
        message: t('Class "text-decoration:bad()" emits invalid CSS: Invalid value for `text-decoration-color` property.'),
        severity: 'error',
        source: '@master/css/no-invalid-classes'
    }]

    return (
        <HomeCodeWindow
            className="home-bento-visual"
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
        message: t('Sort classes into the expected order: "rel flex px:4x font:md bg:white".'),
        severity: 'warning',
        source: '@master/css/sort-classes'
    }]

    return (
        <HomeCodeWindow
            className="home-bento-visual"
            fixPreviewCode={classOrderFixPreviewCode}
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
        message: t('Remove class "m:0"; it is overridden by later class "m:md".'),
        severity: 'warning',
        source: '@master/css/no-conflicting-classes'
    }]

    return (
        <HomeCodeWindow
            className="home-bento-visual"
            fixPreviewCode={conflictingClassesFixPreviewCode}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {conflictingClassesCode}
        </HomeCodeWindow>
    )
}

function CanonicalUtilitiesCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [
        {
            code: 'prefer-canonical-class',
            location: 'home.html:1:12',
            message: t('Use canonical class "text-center" instead of "text-align:center".'),
            severity: 'warning',
            source: '@master/css/prefer-canonical-classes'
        },
        {
            code: 'prefer-canonical-class',
            location: 'home.html:1:30',
            message: t('Use canonical class "m:md" instead of "margin:md".'),
            severity: 'warning',
            source: '@master/css/prefer-canonical-classes'
        }
    ]

    return (
        <HomeCodeWindow
            className="home-bento-visual"
            fixPreviewCode={canonicalUtilitiesFixPreviewCode}
            lang="html"
            problems={problems}
            problemsLabel={t('Problems')}
            variant="embedded">
            {canonicalUtilitiesCode}
        </HomeCodeWindow>
    )
}

function ThemeTokensCodeWindow({ t }: { t: Translate }) {
    const problems: HomeCodeWindowProblem[] = [
        {
            code: 'prefer-canonical-class',
            location: 'home.html:1:10',
            message: t('Use canonical class "font:md" instead of "font:16px".'),
            severity: 'warning',
            source: '@master/css/prefer-canonical-classes'
        },
        {
            code: 'prefer-canonical-class',
            location: 'home.html:1:20',
            message: t('Use canonical class "fg:red-60" instead of "fg:var(--color-red-60)".'),
            severity: 'warning',
            source: '@master/css/prefer-canonical-classes'
        }
    ]

    return (
        <HomeCodeWindow
            className="home-bento-visual"
            fixPreviewCode={themeTokensFixPreviewCode}
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
            className="home-bento-visual"
            lang="bash"
            problems={problems}
            problemsLabel={t('Preview')}
            variant="embedded">
            {safeFixPreviewCode}
        </HomeCodeWindow>
    )
}
