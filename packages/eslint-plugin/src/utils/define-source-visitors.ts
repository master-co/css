import {
  lintMasterCSSContent,
  masterCSSLintRuleIds,
  type MasterCSSLintContentRuleOptions,
  type MasterCSSLintRuleId,
  type MasterCSSLintSourceDiagnostic
} from '@master/css-lint'
import type { MasterCSS } from '@master/css-engine'
import type { RustLintSession } from '@master/css-lint/node'
import type { RuleContext, RuleFixer, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { messageIdByCode, stringifyLintDiagnosticMessageData } from './report-lint-diagnostics'

type FixRange = [number, number]
type SourceRuleOptions = MasterCSSLintContentRuleOptions[keyof MasterCSSLintContentRuleOptions]

interface DefineSourceVisitorsOptions {
  context: RuleContext<any, any[]>
  css: MasterCSS
  ruleId: MasterCSSLintRuleId
  ruleOptions?: SourceRuleOptions
  rustLint?: RustLintSession
}

const SOURCE_LINT_FILE_RE = /\.mdx$/i

export function shouldUseSourceVisitors(context: RuleContext<any, any[]>) {
  const filename = context.physicalFilename || context.filename
  return typeof filename === 'string' && SOURCE_LINT_FILE_RE.test(filename)
}

function getFilename(context: RuleContext<any, any[]>) {
  return context.physicalFilename || context.filename || 'source.mdx'
}

function createSingleRuleSet(ruleId: MasterCSSLintRuleId) {
  return Object.fromEntries(masterCSSLintRuleIds.map((eachRuleId) => [
    eachRuleId,
    eachRuleId === ruleId
  ])) as Record<MasterCSSLintRuleId, boolean>
}

function createRuleOptions(ruleId: MasterCSSLintRuleId, ruleOptions: DefineSourceVisitorsOptions['ruleOptions']) {
  return ruleOptions
    ? { [ruleId]: ruleOptions } as MasterCSSLintContentRuleOptions
    : undefined
}

function reportSourceDiagnostic(
  context: RuleContext<any, any[]>,
  node: any,
  diagnostic: MasterCSSLintSourceDiagnostic
) {
  const { sourceCode } = context
  const messageId = messageIdByCode[diagnostic.code]
  const fix = diagnostic.fixes?.[0]
  const descriptor: any = {
    node,
    loc: {
      start: sourceCode.getLocFromIndex(diagnostic.range.start),
      end: sourceCode.getLocFromIndex(diagnostic.range.end)
    },
    ...(messageId
      ? {
        messageId,
        data: stringifyLintDiagnosticMessageData(diagnostic)
      }
      : { message: diagnostic.message })
  }

  if (fix) {
    descriptor.fix = (fixer: RuleFixer) => fixer.replaceTextRange(
      [fix.range.start, fix.range.end] as FixRange,
      fix.text
    )
  }

  context.report(descriptor)
}

export default function defineSourceVisitors({
  context,
  css,
  ruleId,
  ruleOptions,
  rustLint
}: DefineSourceVisitorsOptions): RuleListener {
  return {
    Program(node) {
      const result = lintMasterCSSContent({
        content: context.sourceCode.getText(),
        filePath: getFilename(context),
        css,
        rules: createSingleRuleSet(ruleId),
        ruleOptions: createRuleOptions(ruleId, ruleOptions),
        lintSession: rustLint
      })
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.ruleId !== ruleId) continue
        reportSourceDiagnostic(context, node, diagnostic)
      }
    }
  }
}
