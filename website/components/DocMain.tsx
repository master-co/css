'use client'

import { styled } from '@master/css.react'

const DocMain = styled.main(
    'max-w:screen-xl mx:auto p:80|20|20|20 p:60|30@print pb:80@md pt:140@md',
    ({ $hideRightSide, $hideLeftSide }) => ({
        'pr:85x@lg': !$hideRightSide,
        'pl:75x@md pl:85x@lg': !$hideLeftSide,
    })
)

DocMain.defaultProps = {
    $hideRightSide: false,
    $hideLeftSide: false
}

export default DocMain