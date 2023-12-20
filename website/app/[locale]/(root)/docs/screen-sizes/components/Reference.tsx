import DocTable from 'websites/components/DocTable'
import { variables } from '@master/css'

export const descriptions = {
    '4xs': 'iPhone 6, 7, 8, X, 11, 12 / Galaxy S8 / HTC One…',
    '3xs': 'Blackberry Passport / Amazon Kindle Fire HD 7…',
    '2xs': 'LG G Pad 8.3 / Amazon Kindle Fire …',
    'xs': 'Microsoft Surface / iPad Pro 9.7 / iPad Mini …',
    'sm': 'iPad Air 10.5 / iPad Pro 11 …',
    'md': 'iPad Pro 12.9 / Microsoft Surface Pro 3 …',
    'lg': 'Google Chromebook Pixel / Samsung Chromebook …',
    'xl': 'Macbook Air 2020 M1 / MacBook Pro 15 …',
    '2xl': 'Dell Inspiron 14 series …',
    '3xl': 'Dell UltraSharp U2412M / Dell S2340M / Apple iMac 21.5-inch …',
    '4xl': 'Dell UltraSharp U2711 / Apple iMac 27-inch …'
}

export default () => {
    return (
        <DocTable>
            <thead>
                <tr>
                    <th className='w:0'>Token</th>
                    <th className='w:0'>Pixels</th>
                    <th className='w:0'>REM</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.entries(variables.screen)
                        .map(([name, value], index) => (
                            <tr key={index}>
                                <th className="white-space:nowrap"><code>screen-{name}</code></th>
                                <td><code className='token number'>{value}<span className='token unit'>px</span></code></td>
                                <td><code className='token number'>{value / 16}<span className='token unit'>rem</span></code></td>
                                <td>{descriptions[name as keyof typeof descriptions]}</td>
                            </tr>
                        ))
                }
            </tbody>
        </DocTable>
    )
}