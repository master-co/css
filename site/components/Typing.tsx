import clsx from 'clsx'
import { Fragment, useEffect, useState } from 'react'
import { mayDelay } from '~/utils/mayDelay'

const Typing = ({
    children: scripts,
    onEnd,
    onWordEnd,
    spaceDuration = 75,
    backspaceDuration = 40,
    duration = 75,
    keepCursor = false,
    randomDelay = 0,
    wordClass,
    wordEndClass,
    endDelay = 1000,
    startDelay = 0,
    gap = 0
}: any) => {
    const [text, setText] = useState('')
    const [isEnd, setIsEnd] = useState(false)
    const [isSpace, setIsSpace] = useState(false)
    const [scriptIndex, setScriptIndex] = useState(0)
    const [wholeText, setWholeText] = useState(scripts
        .filter((script: any) => typeof script === 'string')
        .join(''))
    const [remainingReduction, setRemainingReduction] = useState(0)
    const [lastWord, setLastWord] = useState(scripts[0])
    const [currentScript, setCurrentScript] = useState<any>(null)
    const [delay, setDelay] = useState(0)
    const [isWordEnd, setIsWordEnd] = useState(false)

    useEffect(() => {
        if (isEnd) {
            return
        }
        if (text.length === wholeText || scriptIndex === scripts.length) {
            setIsEnd(true)
            onEnd && mayDelay(onEnd, endDelay)
            return
        }

        const eachRandomDelay = randomDelay ? Math.random() * randomDelay : 0
        setCurrentScript(scripts[scriptIndex])
        const isNumberCurrentScript = typeof currentScript === 'number'
        if (isNumberCurrentScript) {
            if (!remainingReduction) {
                setRemainingReduction(
                    currentScript === 0
                        ? -scripts[scriptIndex - 1].length
                        : currentScript
                )
            }
        } else if (currentScript) {
            setLastWord(currentScript)
        }

        const handle = window.setTimeout(
            () => {
                let newLength = 0
                if (remainingReduction) {
                    setText(text.slice(0, -1))
                    setRemainingReduction(remainingReduction + 1)
                    setWholeText(wholeText.slice(0, text.length - 1) + wholeText.slice(text.length))
                    if (remainingReduction + 1 === 0) {
                        setScriptIndex(scriptIndex + 1)
                    }
                    gap && setDelay(0)
                    return
                } else {
                    newLength = text.length + 1
                }
                let newText = wholeText.substr(0, newLength)
                setIsSpace(wholeText.charAt(newLength) === ' ')
                setText(newText)
                const isEachWordEnd = newText.endsWith(lastWord)
                if (isEachWordEnd) {
                    setScriptIndex(scriptIndex + 1)
                    lastWord !== ' ' && onWordEnd?.(lastWord)
                }
                gap && setDelay(isEachWordEnd ? gap : 0)
                setIsWordEnd(isEachWordEnd)
            },
            (isNumberCurrentScript
                ? backspaceDuration
                : (isSpace ? spaceDuration : duration)
            )
            + eachRandomDelay + delay
            + (startDelay && text === '' && scriptIndex === 0 ? startDelay : 0)
        )
        return () => window.clearTimeout(handle)
    }, [scripts, text, onEnd, onWordEnd, endDelay, isEnd, delay, gap, backspaceDuration, isSpace, spaceDuration, duration, currentScript, scriptIndex, wholeText, remainingReduction, lastWord, randomDelay, startDelay])

    return (
        <>
            {text.split(' ').map((word, index, splits) => (
                <Fragment key={index}>
                    {index !== 0 && ' '}
                    <span className={clsx(wordClass, (isWordEnd || splits.length - 1 > index) && wordEndClass)}>
                        {word}
                    </span>
                </Fragment>
            ))}
            {
                (!isEnd || keepCursor) && <svg width="0.1em" height="1.125em"
                    // use style not master styles to prevent blocking
                    style={{
                        animation: (isEnd || isSpace || delay) ? 'flash 2s infinite' : '',
                        backgroundColor: 'white',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        margin: '-.2em 0px'
                    }}
                ></svg>
            }
        </>
    )
}

export default Typing