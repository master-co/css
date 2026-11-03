import { useTranslation } from 'next-i18next'
import { useEffect, useState } from 'react'
import Code from '~/components/Code'
import CodeTabs from '~/components/Code/CodeTabs'
import StylesHomeLearnMore from '~/components/StylesHomeLearnMore'

export default function ADynamicallyAssignedValue() {
    const [size, setSize] = useState(70)
    const { t } = useTranslation('home.css')
    const code = `
        <div class="font:teal-**${size}** font:purple-**${size}**:hover font:96 font:heavy">Aa</div>
    `
    return (
        <div className="homeContainer grid-cols:1 grid-cols:9@md gap:30|0 gap:80@sm">
            <div className="grid-col-span:4 flex flex:col align-items:center">
                <div className={`font:teal-${size} font:purple-${size}:hover font:96 font:heavy`}>Aa</div>
                <input type="range" defaultValue={size} min="2" max="98" step="2"
                    onInput={(event: any) => {
                        setSize(event.target.value)
                    }}
                    className="inputSlider max-w:150 w:full mb:30" />
                <Code lang="html" className="w:full mt:auto">{code}</Code>
            </div>
            <div className="grid-col-span:5">
                <h2 className="homeTitle">{t('Dynamically assign values.')}</h2>
                <p>
                    {t('Dynamic assignment is applicable to all styles, so you can assign even after fetching data from the server.')}
                </p>
                <CodeTabs>{[
                    {
                        name: 'react', lang: 'tsx',
                        code: `
                            <div className={\`font:teal-\$\{size\} font:purple-\$\{size\}:hover font:96 font:heavy\`}>
                                Aa
                            </div>
                        `
                    },
                    {
                        name: 'angular', lang: 'html',
                        code: `
                            <div class="font:teal-{{size}} font:purple-{{size}}:hover font:96 font:heavy">
                                Aa
                            </div>
                        `
                    },
                    {
                        name: 'vue', lang: 'html',
                        code: `
                            <div :class="\`font:teal-\$\{size\} font:purple-\$\{size\}:hover font:96 font:heavy\`">
                                Aa
                            </div>
                        `
                    },
                ]}</CodeTabs>
            </div>
        </div>
    )
}