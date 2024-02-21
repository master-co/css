import React, { forwardRef } from 'react'
import styled from '../src/styled'

export default function Styled() {
    // Basic
    const MasterButton = styled.button<{ $color: string }>`
        inline-flex center-content
        ${['font:14', 'font:semibold']}
        ${{ test: true, test2: false, test3: true }}
        fg:white px:18 h:40 r:4
        bg:${({ $color }) => $color}
    `

    // Extend master component
    const ExtendMasterButton = styled<typeof MasterButton, { $size: string }>(MasterButton)`bg:${({ $color }) => $color}-54:hover`
    const ExtendMasterAnchor = styled.a(MasterButton)``

    // Extend custom component
    const CustomComponent = forwardRef((props: { $type: string }, ref: any) => <a ref={ref} {...props}></a>)
    const ExtendCustomComponent = styled<typeof CustomComponent, { $newType: string }>(CustomComponent)`inline-flex center-content font:14 font:semibold ${(props) => props.$type} ${(props) => props.$newType}`

    // Prop composition
    const PropCompositionButton = styled.button<{ $intent: string, $size: string }>`
        font:semibold rounded
        ${{
            $intent: {
                primary: 'bg:blue-50 fg:white bg:blue-60:hover',
                secondary: 'bg:white fg:gray-80 b:gray-40 bg:gray-50:hover',
            },
            $size: {
                sm: 'font:20 py:1 px:2',
                md: 'font:16 py:2 px:4'
            },
            disabled: 'opacity:.5'
        }}
        ${['uppercase', { $intent: 'primary', $size: 'md' }]}
        ${({ $intent, $size }) => ({ 'font:italic': !!$intent && !!$size })}
    `
    PropCompositionButton.defaultProps = {
        $intent: 'primary'
    }
    const ExtendPropCompositionButton = styled(PropCompositionButton)`
        ${{
            $intent: {
                primary: 'bg:blue-70 fg:black bg:blue-80:hover'
            },
            $size: {
                lg: 'font:32 py:5 px:7'
            },
            disabled: 'opacity:.6'
        }}
        ${['uppercase', { $intent: 'primary', $size: 'md' }]}
    `

    // Alternative syntax
    const AlternativeSyntaxDiv = styled<{ $intent: string, $size: string }>(
        'font:semibold rounded',
        {
            $intent: {
                primary: 'bg:blue-50 fg:white bg:blue-60:hover',
                secondary: 'bg:white fg:gray-80 b:gray-40 bg:gray-50:hover',
            },
            $size: {
                sm: 'font:20 py:1 px:2',
                md: 'font:16 py:2 px:4'
            }
        },
        ['uppercase', { $intent: 'primary', $size: 'md' }],
        ({ $intent, $size }) => $intent && $size && 'font:italic'
    )
    const AlternativeSyntaxButton = styled.button<{ $intent: string, $size: string }>(
        'font:semibold rounded',
        {
            $intent: {
                '': 'bg:purple-50 fg:black bg:purple-60:hover',
                primary: 'bg:blue-50 fg:white bg:blue-60:hover',
                secondary: 'bg:white fg:gray-80 b:gray-40 bg:gray-50:hover',
            },
            $size: {
                sm: 'font:20 py:1 px:2',
                md: 'font:16 py:2 px:4'
            }
        },
        {
            HIHI: false
        },
        ({ disabled }) => ([
            'b:2|solid|red',
            {
                $intent: disabled ? 'secondary' : 'third',
                $size: 'lg'
            }]
        ),
        ['uppercase', { $intent: 'primary', $size: 'md', disabled: false }],
        ({ $intent, $size }) => $intent && $size && 'font:italic'
    )
    const ExtendAlternativeSyntaxButton = styled<typeof AlternativeSyntaxButton, { $intent: string, $size: string }>(AlternativeSyntaxButton)(
        {
            $intent: {
                primary: 'bg:blue-70 fg:black bg:blue-80:hover'
            },
            $size: {
                lg: 'font:32 py:5 px:7'
            }
        },
        ({ disabled }) => ([
            'b:2|solid|blue',
            {
                $intent: disabled ? 'secondary' : 'third',
                $size: 'lg',
            }
        ]),
        ['lowercase', { $intent: 'primary', $size: 'md', disabled: true }]
    )

    return <>
        <MasterButton id="basic" $color="red">Basic</MasterButton>
        <ExtendMasterButton id="extend-master" $color="blue">Extend</ExtendMasterButton>
        <ExtendMasterAnchor id="extend-master-a" $color="purple">Extend & Transform Tag</ExtendMasterAnchor>
        <ExtendCustomComponent id="extend-custom" $newType="NewType" $type="CustomType">Extend Custom Component</ExtendCustomComponent>
        <PropCompositionButton id="composition-md" $size="md">Prop Composition</PropCompositionButton>
        <PropCompositionButton id="composition-secondary-disabled" $intent="secondary" disabled={true}>Prop Composition</PropCompositionButton>
        <ExtendPropCompositionButton id="extend-composition-md" $size="md">Extend</ExtendPropCompositionButton>
        <ExtendPropCompositionButton id="extend-composition-secondary" $intent="secondary">Extend</ExtendPropCompositionButton>
        <ExtendPropCompositionButton id="extend-composition-secondary-disabled" $intent="secondary" $size="lg" disabled={true}>Extend</ExtendPropCompositionButton>
        <AlternativeSyntaxDiv id="alternative-syntax-div" $intent="primary" $size="md">Alternative Syntax</AlternativeSyntaxDiv>
        <AlternativeSyntaxButton id="alternative-syntax-button-md" $size="md">Alternative Syntax</AlternativeSyntaxButton>
        <AlternativeSyntaxButton id="alternative-syntax-button-primary-md" $intent="primary" $size="md">Alternative Syntax</AlternativeSyntaxButton>
        <AlternativeSyntaxButton id="alternative-syntax-button-secondary-lg-disabled" $intent="secondary" $size="lg" disabled={true}>Alternative Syntax</AlternativeSyntaxButton>
        <ExtendAlternativeSyntaxButton id="extend-alternative-syntax-button-primary-md-disabled" $intent="primary" $size="md" disabled={true}>Extend</ExtendAlternativeSyntaxButton>
        <ExtendAlternativeSyntaxButton id="extend-alternative-syntax-button-third-lg" $intent="third" $size="lg">Extend</ExtendAlternativeSyntaxButton>
    </>
}