import { test, expect } from '@playwright/experimental-ct-vue'
import StyledComponent from './Styled.vue'

test.beforeEach(async ({ mount }) => {
    await mount(StyledComponent)
})

test('Basic', async ({ page }) => {    
    expect(await page.evaluate(() => document.querySelector('#basic')?.outerHTML))
        .toBe('<button id="basic" class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:red">Basic</button>')
    expect(await page.evaluate(() => document.querySelector('#custom')?.outerHTML))
        .toBe('<button id="custom" class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:red">Custom</button>')
})

test('Extend master component', async ({ page }) => {
    expect(await page.evaluate(() => document.querySelector('#extend-master')?.outerHTML))
        .toBe('<button id="extend-master" class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:blue bg:blue-54:hover">Extend</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-master-a')?.outerHTML))
        .toBe('<a id="extend-master-a" class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:purple">Extend &amp; Transform Tag</a>')
})

test('Extend custom component', async ({ page }) => {
    expect(await page.evaluate(() => document.querySelector('#extend-master')?.outerHTML))
        .toBe('<button id="extend-master" class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:blue bg:blue-54:hover">Extend</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-master-a')?.outerHTML))
        .toBe('<a id="extend-master-a" class="test test3 inline-flex center-content font:14 font:semibold fg:white px:18 h:40 r:4 bg:purple">Extend &amp; Transform Tag</a>')
})

test('Default props', async ({ page }) => {
    expect(await page.evaluate(() => document.querySelector('#default-props')?.outerHTML))
        .toBe('<button color="red" id="default-props" class="bg:red">Default Props</button>')
})

test('Prop composition', async ({ page }) => {
    expect(await page.evaluate(() => document.querySelector('#composition-md')?.outerHTML))
        .toBe('<button intent="primary" id="composition-md" size="md" class="font:italic font:semibold rounded uppercase bg:blue-50 fg:white bg:blue-60:hover font:16 py:2 px:4">Prop Composition</button>')
    expect(await page.evaluate(() => document.querySelector('#composition-secondary-disabled')?.outerHTML))
        .toBe('<button intent="secondary" id="composition-secondary-disabled" disabled="" class="font:semibold rounded bg:white fg:gray-80 b:gray-40 bg:gray-50:hover opacity:.5">Prop Composition</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-composition-md')?.outerHTML))
        .toBe('<button intent="primary" id="extend-composition-md" size="md" class="font:italic font:semibold rounded uppercase bg:blue-70 fg:black bg:blue-80:hover font:16 py:2 px:4">Extend</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-composition-secondary')?.outerHTML))
        .toBe('<button intent="secondary" id="extend-composition-secondary" class="font:semibold rounded bg:white fg:gray-80 b:gray-40 bg:gray-50:hover">Extend</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-composition-secondary-disabled')?.outerHTML))
        .toBe('<button intent="secondary" id="extend-composition-secondary-disabled" size="lg" disabled="" class="font:italic font:semibold rounded bg:white fg:gray-80 b:gray-40 bg:gray-50:hover font:32 py:5 px:7 opacity:.6">Extend</button>')
})

test('Alternative syntax', async ({ page }) => {
    expect(await page.evaluate(() => document.querySelector('#alternative-syntax-div')?.outerHTML))
        .toBe('<div id="alternative-syntax-div" class="font:semibold rounded font:italic uppercase bg:blue-50 fg:white bg:blue-60:hover font:16 py:2 px:4">Alternative Syntax</div>')
    expect(await page.evaluate(() => document.querySelector('#alternative-syntax-button-md')?.outerHTML))
        .toBe('<button id="alternative-syntax-button-md" class="font:semibold rounded bg:purple-50 fg:black bg:purple-60:hover font:16 py:2 px:4">Alternative Syntax</button>')
    expect(await page.evaluate(() => document.querySelector('#alternative-syntax-button-primary-md')?.outerHTML))
        .toBe('<button id="alternative-syntax-button-primary-md" class="font:semibold rounded font:italic uppercase bg:blue-50 fg:white bg:blue-60:hover font:16 py:2 px:4">Alternative Syntax</button>')
    expect(await page.evaluate(() => document.querySelector('#alternative-syntax-button-secondary-lg-disabled')?.outerHTML))
        .toBe('<button id="alternative-syntax-button-secondary-lg-disabled" disabled="" class="font:semibold rounded font:italic b:2|solid|red bg:white fg:gray-80 b:gray-40 bg:gray-50:hover">Alternative Syntax</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-alternative-syntax-button-primary-md-disabled')?.outerHTML))
        .toBe('<button id="extend-alternative-syntax-button-primary-md-disabled" disabled="" class="font:semibold rounded font:italic lowercase bg:blue-70 fg:black bg:blue-80:hover font:16 py:2 px:4">Extend</button>')
    expect(await page.evaluate(() => document.querySelector('#extend-alternative-syntax-button-third-lg')?.outerHTML))
        .toBe('<button id="extend-alternative-syntax-button-third-lg" class="font:semibold rounded font:italic b:2|solid|blue font:32 py:5 px:7">Extend</button>')
})
