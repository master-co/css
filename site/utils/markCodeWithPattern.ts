export function markCodeWithPattern(code: string, pattern: string) {
    return code.replace(new RegExp(`(${pattern})`, 'g'), '**$1**')
}