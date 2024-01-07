import { readFileSync } from 'fs'
import { render } from '../src'

export default function testGeneratedCSS(templatePath: string, config: any, generatedCSSPath: string) {
    expect(
        render(
            readFileSync(templatePath).toString().replace(/\*\*/g, ''),
            config
        ).css?.text
    )
        .toContain(readFileSync(generatedCSSPath).toString())
}