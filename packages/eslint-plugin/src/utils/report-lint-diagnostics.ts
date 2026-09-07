import type { RuleContext, RuleFixer } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/utils'
import type { MasterCSSLintDiagnostic, MasterCSSLintFix } from '@master/css-tooling/lint'
import type { ResolvedClassNode } from './resolve-class-node'

type FixRange = [number, number]

interface ReportLintDiagnosticsOptions {
  getFix?: (diagnostic: MasterCSSLintDiagnostic, fix: MasterCSSLintFix) => { range: FixRange, text: string } | undefined
}

export const messageIdByCode: Record<string, string> = {
  'invalid-class-order': 'invalidClassOrder',
  'invalid-class': 'invalidClass',
  'unknown-class': 'disallowUnknownClass',
  'conflicting-class': 'collisionClass',
  'partially-conflicting-class': 'partialCollisionClass',
  'prefer-canonical-class': 'preferClass',
  'prefer-native-declaration': 'preferClass',
  'prefer-variant-block': 'preferClass',
  'unapproved-raw-value': 'unapprovedRawValue'
}

export function stringifyLintDiagnosticData(data: MasterCSSLintDiagnostic['data'] = {}) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : String(value)])
  )
}

export function stringifyLintDiagnosticMessageData(diagnostic: Pick<MasterCSSLintDiagnostic, 'data' | 'message'>) {
  return stringifyLintDiagnosticData({
    ...diagnostic.data,
    message: diagnostic.message
  })
}

function defaultFix(resolved: ResolvedClassNode, fix: MasterCSSLintFix) {
  if (fix.scope === 'directive') return
  return {
    range: [
      resolved.start + fix.range.start,
      resolved.start + fix.range.end
    ] as FixRange,
    text: fix.text
  }
}

export default function reportLintDiagnostics(
  context: RuleContext<any, any[]>,
  node: TSESTree.Node,
  resolved: ResolvedClassNode,
  diagnostics: readonly MasterCSSLintDiagnostic[],
  options: ReportLintDiagnosticsOptions = {}
) {
  const { sourceCode } = context
  for (const diagnostic of diagnostics) {
    const start = resolved.start + diagnostic.range.start
    const end = resolved.start + diagnostic.range.end
    const messageId = messageIdByCode[diagnostic.code]
    const fix = diagnostic.fix
      ? options.getFix?.(diagnostic, diagnostic.fix) || defaultFix(resolved, diagnostic.fix)
      : undefined

    const descriptor: any = {
      node,
      loc: {
        start: sourceCode.getLocFromIndex(start),
        end: sourceCode.getLocFromIndex(end),
      },
      ...(messageId
        ? {
          messageId,
          data: stringifyLintDiagnosticMessageData(diagnostic)
        }
        : { message: diagnostic.message })
    }
    if (fix) {
      descriptor.fix = (fixer: RuleFixer) => fixer.replaceTextRange(fix.range, fix.text)
    }
    context.report(descriptor)
  }
}
