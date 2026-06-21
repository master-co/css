import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { expectClassPosition } from './test'

test.concurrent('class in class array', () => {
    const target = 'class-a'
    const contents = ['<div :class="[ isActive && `', target, '` ]"></div>']
    expectClassPosition(target, contents, 'vue')
})

test.concurrent('class in object syntax', () => {
    const target = 'class-a'
    const contents = ['<div :class="{ \'', target, '\': isActive }"></div>']
    expectClassPosition(target, contents, 'vue')
})

test.concurrent('class in ternary operator', () => {
    const target = 'class-a'
    const contents = ['<div :class="isActive ? \'', target, '\' : inactiveClass"></div>']
    expectClassPosition(target, contents, 'vue')
})

test.concurrent('class in v-bind', () => {
    const target = 'class-a'
    const contents = ['<div v-bind:class="{ active: isActive, \'', target, '\': hasError }"></div>']
    expectClassPosition(target, contents, 'vue')
})

test.concurrent('multiple :class assignments', () => {
    const target = 'a'
    const contents = [dedent`
        <template>
        <div>
            <h1 :class="{ 'red': isRed, 'bold': isBold }">Hello, Vue!</h1>
            <p :class="[colorClass, { 'italic `, target, dedent`': isItalic }]">This is a sample Vue template.</p>
        </div>
        </template>
    `]
    expectClassPosition(target, contents, 'vue')
})