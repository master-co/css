import DocTable from 'internal/components/DocTable'
import { screens, variables } from '@master/css'
import InlineCode from '~/internal/components/InlineCode'

const descriptions = {
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
                    <th className='w:0'>At</th>
                    <th className='w:0'>Variable</th>
                    <th className='w:0'>Value</th>
                    <th className='w:0'></th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {
                    Object.entries(screens)
                        .map(([name, value], index) => (
                            <tr key={index}>
                                <th className="white-space:nowrap"><InlineCode>{`@${name}`}</InlineCode></th>
                                <th className="white-space:nowrap"><InlineCode>{`screen-${name}`}</InlineCode></th>
                                <td><InlineCode lang="ts">{`${value}`}</InlineCode></td>
                                <td><InlineCode>{`(${value / 16}rem)`}</InlineCode></td>
                                <td>{descriptions[name as keyof typeof descriptions]}</td>
                            </tr>
                        ))
                }
            </tbody>
        </DocTable>
    )
}