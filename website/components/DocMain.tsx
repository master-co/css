import { styled } from '@master/css.react'

const DocMain = styled.main(
    'max-w:xl mx:auto p:80|20|20|20 p:60|30@print pb:80@lg pt:140@lg',
    ({ $hideRightSide, $hideLeftSide }) => ({
        'pr:340@lg': !$hideRightSide,
        'pl:340@lg': !$hideLeftSide,
    })
)

DocMain.defaultProps = {
    $hideRightSide: false,
    $hideLeftSide: false
}

export default DocMain