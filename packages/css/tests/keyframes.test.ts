import MasterCSS, { Rule, render } from '../src'
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

it('expects the animation output', () => {
    expect(render(['@fade|1s'])).toContain('.\\@fade\\|1s{animation:fade 1s}')
})

it('expects the keyframe output', () => {
    expect(render(['@fade|1s'])).toContain('@keyframes fade{0%{opacity:0}to{opacity:1}}')
    expect(render(['@flash|1s'])).toContain('@keyframes flash{0%,50%,to{opacity:1}25%,75%{opacity:0}}')
    expect(render(['@float|1s'])).toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
    expect(render(['@heart|1s'])).toContain('@keyframes heart{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}')
    expect(render(['@jump|1s'])).toContain('@keyframes jump{0%,to{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)}}')
    expect(render(['@ping|1s'])).toContain('@keyframes ping{75%,to{transform:scale(2);opacity:0}}')
    expect(render(['@pulse|1s'])).toContain('@keyframes pulse{0%{transform:none}50%{transform:scale(1.05)}to{transform:none}}')
    expect(render(['@rotate|1s'])).toContain('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}')
    expect(render(['@shake|1s'])).toContain('@keyframes shake{0%{transform:none}6.5%{transform:translateX(-6px) rotateY(-9deg)}18.5%{transform:translateX(5px) rotateY(7deg)}31.5%{transform:translateX(-3px) rotateY(-5deg)}43.5%{transform:translateX(2px) rotateY(3deg)}50%{transform:none}}')
    expect(render(['@zoom|1s'])).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
    expect(render(['{@zoom|1s;f:16}'])).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
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

        const animationClassNames = className.startsWith('{')
            ? className.slice(1, className.length - 1).split(';')
            : [className]
        const keyframeNames = animationClassNames
            .flatMap(eachAnimationClassName => (eachAnimationClassName.includes(':') 
                ? eachAnimationClassName.split(':')[1] 
                : eachAnimationClassName.slice(1)).split('|').filter(eachValue => configKeyframeNames.includes(eachValue)))
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

    await generateAnimation('@fade|2s')
    await generateAnimation('{@name:flash;@name:fade}')

    await deleteAnimation('{@name:flash;@name:fade}')
    await deleteAnimation('@fade|2s')
})
