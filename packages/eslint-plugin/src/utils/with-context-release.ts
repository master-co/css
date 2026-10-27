import type { RuleListener } from '@typescript-eslint/utils/ts-eslint'

export default function withContextRelease(visitors: RuleListener, release: () => void): RuleListener {
  const visitProgramExit = visitors['Program:exit']
  return {
    ...visitors,
    'Program:exit'(node) {
      try {
        if (typeof visitProgramExit === 'function') visitProgramExit(node)
      } finally {
        release()
      }
    }
  }
}
