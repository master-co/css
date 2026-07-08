import Link from 'internal/components/Link'

export default () => {
    return (
        <figure className='doc-table'>
            <table>
                <thead>
                    <tr>
                        <th className='w:0'>Layer</th>
                        <th>Description</th>
                        <th>CSS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Base</th>
                        <td>Where the styles with <code>@base</code> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer base { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Theme</th>
                        <td>Where the used <Link href="/guide/theme#theme-tokens">theme tokens</Link> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer theme { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Defaults</th>
                        <td>Where the styles with <code>@default</code> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer defaults { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Components</th>
                        <td>Where the used <Link href="/guide/global-styles#component-classes">component classes</Link> are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer components { … }'}</code></td>
                    </tr>
                    <tr>
                        <th>Utilities</th>
                        <td>Where the utility styles are generated.</td>
                        <td className="white-space:nowrap"><code>{'@layer utilities { … }'}</code></td>
                    </tr>
                </tbody>
            </table>
        </figure>
    )
}
