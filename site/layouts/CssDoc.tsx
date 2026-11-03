import Doc from './Doc';
import cssContents from '~/contents/cssContents';
import uiContents from '~/contents/uiContents';
import StylePlayground from '~/components/Css/StylePlayground';

export default function CssDoc({ children }: any) {
    return (
        <>
            {children}
            <StylePlayground></StylePlayground>
        </>
    )
}

Object.assign(CssDoc, {
    Container: Doc,
    getProps: (props: any) => ({
        version: '1.37.8',
        contents: cssContents,
        seriesContents: uiContents,
        suffix: props.suffix === false ? '' : (props.suffix || 'Master CSS'),
        series: 'UI',
        name: 'CSS',
        cover: 'css.jpg',
        showThemeToggle: true
    })
})