import '../src/polyfills/css-escape'
import MasterCSS, { Rule } from '../src'
import delay from '../src/utils/delay'

it('make sure not to extend keyframes deeply', () => {
    const css = new MasterCSS({
        keyframes: {
            fade: {}
        },
        observe: false
    })
    expect(css.config.keyframes?.fade).toEqual({})
})

test('keyframes', async () => {
    const p1 = document.createElement('p')
    p1.classList.add('block', 'font:bold')
    document.body.append(p1)

    const css = new MasterCSS()
    const sheet = css.style.sheet

    const countByKeyframeName = {}
    const configKeyframeNames = Object.keys(css.config?.keyframes || {})
    const checkKeyframeCSSRule = () => {
        if (Object.keys(css.keyframes).length) {
            const keyframeRule = css.rules[0]
            for (let i = 0; i < keyframeRule.natives.length; i++) {
                const cssRule = sheet?.cssRules[i]
                expect(cssRule).toEqual(keyframeRule.natives[i].cssRule)
            }

            expect(css.rules[0] instanceof Rule).toBeFalsy()
        } else {
            expect(sheet?.cssRules[0].constructor.name).not.toEqual('CSSKeyframesRule')
            expect(css.rules[0] instanceof Rule).toBeTruthy()
        }
    }
    const generateAnimation = async (className: string) => {
        p1.classList.add(className)
        await delay()

        const rule = css.ruleBy[className]
        const keyframeNames = (className.includes(':') ? className.split(':')[1] : className.slice(1)).split('|').filter(eachValue => configKeyframeNames.includes(eachValue))
        expect(rule.keyframeNames.length).toEqual(keyframeNames.length)
        expect(rule.keyframeNames.every(eachKeyframeName => keyframeNames.includes(eachKeyframeName))).toBeTruthy()

        for (const eachKeyframeName of rule.keyframeNames) {
            if (eachKeyframeName in countByKeyframeName) {
                countByKeyframeName[eachKeyframeName]++
            } else {
                countByKeyframeName[eachKeyframeName] = 1
            }

            expect(eachKeyframeName in css.keyframes).toBeTruthy()
            expect(css.keyframes[eachKeyframeName].count).toEqual(countByKeyframeName[eachKeyframeName])
        }

        checkKeyframeCSSRule()
    }
    const deleteAnimation = async (className: string) => {
        const rule = css.ruleBy[className]

        p1.classList.remove(className)
        await delay()

        for (const eachKeyframeName of rule.keyframeNames) {
            countByKeyframeName[eachKeyframeName]--

            const count = countByKeyframeName[eachKeyframeName]
            expect(eachKeyframeName in css.keyframes).toEqual(!!count)
            if (count) {
                expect(css.keyframes[eachKeyframeName].count).toEqual(count)
            }
        }

        checkKeyframeCSSRule()
    }

    await generateAnimation('@fade')
    await generateAnimation('@name:flash|fade')

    await deleteAnimation('@name:flash|fade')
    await deleteAnimation('@fade')
})
