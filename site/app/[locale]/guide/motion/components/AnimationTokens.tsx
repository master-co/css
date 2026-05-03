import { animations } from '@master/css'
import ExpandContent from '~/internal/components/ExpandContent'
import InlineCode from '~/internal/components/InlineCode'

type AnimationKeyframes = typeof animations[keyof typeof animations]

const getCSS = (name: string, keyframes: AnimationKeyframes) => {
    const frames = Object.entries(keyframes)
        .flatMap(([selector, declarations], index, arr) => [
            `    ${selector} { `,
            ...Object.entries(declarations)
                .map(([property, value]) => `${property}: ${value}; `),
            '}',
            index !== arr.length - 1 ? '' : undefined
        ].join(''))
        .filter((line): line is string => line !== undefined)

    return frames.join('\n')
}

export default () => {
    const animationEntries = Object.entries(animations)

    return (
        <ExpandContent>
            <table>
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Keyframes CSS</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        animationEntries.map(([key, keyframes]) => (
                            <tr key={key}>
                                <th>{key}</th>
                                <td>
                                    <InlineCode lang='css' className="white-space:pre">{getCSS(key, keyframes)}</InlineCode>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </ExpandContent>
    )
}
