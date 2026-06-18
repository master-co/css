import React from 'react'
import styled from '@master/styled.react'
import clsx from 'clsx'

export const A = () => <div className={`block ${'content:\'123\' text-center'}`}>hello world</div>
export const B = () => <div className={'block content:\'123\' animation-delay:.3s'}>hello world</div>
export const C = () => <div className={clsx('class-a class-b', `class-c class-d block
class-d fg:blue-40 text-center`)}></div>

const Button = styled.button('text-center')