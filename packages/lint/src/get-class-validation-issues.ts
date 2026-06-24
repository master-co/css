import { validate } from '@master/css-validator'
import type { MasterCSS } from '@master/css'

export interface ClassValidationOptions {
    disallowUnknownClass?: boolean
    displayClassName?: string
}

export type ClassValidationIssueKind = 'invalid' | 'unknown'

export interface ClassValidationIssue {
    kind: ClassValidationIssueKind
    className: string
    message: string
}

export default function getClassValidationIssues(
    className: string,
    css: MasterCSS,
    options: ClassValidationOptions = {}
): ClassValidationIssue[] {
    const { matched, errors } = validate(className, css)
    const issues: ClassValidationIssue[] = []
    for (const error of errors) {
        if (matched) {
            issues.push({
                kind: 'invalid',
                className,
                message: error.message + '.'
            })
        } else if (options.disallowUnknownClass) {
            issues.push({
                kind: 'unknown',
                className,
                message: `"${options.displayClassName || className}" is not a valid or known class.`
            })
        }
    }
    return issues
}
