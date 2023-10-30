import { styled } from '@master/css.react';

const DocMain = styled.main(
    'max-w:xl mx:auto p:80|30|30|30 pt:140@lg pb:80@lg p:60|30@print',
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