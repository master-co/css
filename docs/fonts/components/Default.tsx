import { fonts } from '@master/css'
import InlineCode from 'shared/components/InlineCode'

export default () => <table>
    <thead>
        <tr>
            <th className="w:0">Font</th>
            <th>Values</th>
        </tr>
    </thead>
    <tbody>
        {
            Object.keys(fonts)
                .map((eachFontName) => {
                    // @ts-ignore
                    const eachFont = fonts[eachFontName]
                    return (
                        <tr key={eachFontName}>
                            <td>
                                <code>{eachFontName}</code>
                            </td>
                            <td>
                                {<InlineCode lang="ts">{JSON.stringify(eachFont)}</InlineCode>}
                            </td>
                        </tr>
                    )
                })
        }
    </tbody>
</table>