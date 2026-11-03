import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useState } from 'react'
import Code from '~/components/Code';
import CodeTabs from '~/components/Code/CodeTabs';
import Switch from '~/components/Switch';

export default function ConditionallyApplyClassNames() {
    const { t } = useTranslation('home.css')
    const [flipped, setFlipped] = useState(true)
    return (
        <div className="homeContainer grid-cols:1 grid-cols:9@md gap:30|0 gap:80@sm mt:40 mt:80@md">
            <div className="grid-col-span:4 flex flex:col align-items:center">
                <div className={clsx('~transform|.3s font:96 font:heavy font:96 font:heavy', {
                    'scaleX(-1)': flipped
                })}>
                    Aa
                </div>
                <div className="mb:30">
                    <Switch defaultValue={flipped} onInput={() => setFlipped(!flipped)} />
                </div>
                <Code lang="html" className="w:full mt:auto">{`
                    <div class="${flipped ? '**scaleX(-1)** ' : ''}~transform|.3s font:96 font:heavy">Aa</div>
                `}</Code>
            </div>
            <div className="grid-col-span:5">
                <h2 className="homeTitle">{t('Conditionally apply class names.')}</h2>
                <p>{t('To conditionally manipulate class names, you can use vanilla JS or any other framework.')}</p>
                <CodeTabs>{[
                    {
                        name: 'react', lang: 'tsx',
                        code: `
                            <div className={(flipped ? 'scaleX(-1) ' : '') + '~transform|.3s font:96 font:heavy'}>
                                Aa
                            </div>
                        `
                    },
                    {
                        name: 'angular', lang: 'html',
                        code: `
                            <div [ngClass]="{'scaleX(-1)': flipped}" class="~transform|.3s font:96 font:heavy">
                                Aa
                            </div>
                        `
                    },
                    {
                        name: 'vue', lang: 'html',
                        code: `
                            <div :class="[{'scaleX(-1)': flipped}, '~transform|.3s font:96 font:heavy']">
                                Aa
                            </div>
                        `
                    },
                ]}</CodeTabs>
            </div>
        </div>
    )
}