import Doc from './Doc';
import uiContents from '~/contents/uiContents';
import componentsContents from '~/contents/componentsContents';

export default function ComponentsDoc({ children }: any) {
    return (
        <>
            {children}
        </>
    )
}

Object.assign(ComponentsDoc, {
    Container: Doc,
    getProps: (props: any) => ({
        version: '1.0',
        contents: componentsContents,
        seriesContents: uiContents,
        suffix: props.suffix === false ? '' : (props.suffix || 'Master Components'),
        series: 'UI',
        name: 'components',
        showThemeToggle: true
    })
})
