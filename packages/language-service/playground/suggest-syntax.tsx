import React from 'react'
import styled from '@master/styled.react'
import clsx from 'clsx'

export const A = () => <div className={`display:block ${'content:\'123\' text-align:center'}`}>hello world</div>
export const B = () => <div className={'display:block content:\'123\' animation-delay:.3s'}>hello world</div>
export const C = () => <div className={clsx('class-a class-b', `class-c class-d display:block
class-d fg-blue-40 text-align:center`)}></div>

const Button = styled.button('text-align:center')