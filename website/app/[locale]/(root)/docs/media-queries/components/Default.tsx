import { mediaQueries } from '@master/css'
import InlineCode from 'websites/components/InlineCode'
import DocTable from 'websites/components/DocTable'

export default () =>
    <DocTable>
        <thead>
            <tr>
                <th>Token</th>
                <th>Size</th>
                <th>Devices</th>
            </tr>
        </thead>
        <tbody>
            {
                [
                    ...Object.keys(mediaQueries)
                        .map((eachBreakpointName) => {
                            // @ts-ignore
                            const eachBreakpoint = mediaQueries[eachBreakpointName]
                            return (
                                <tr key={eachBreakpointName}>
                                    <th>{eachBreakpointName}</th>
                                    <td>
                                        <div className='token number'>{eachBreakpoint}<span className='token unit'>px</span></div>
                                    </td>
                                    <td>
                                        {
                                            {
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
                                            }[eachBreakpointName]
                                        }
                                    </td>
                                </tr>
                            )
                        })
                ]
            }
        </tbody>
    </DocTable>