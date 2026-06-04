import config from './config.mjs'

function getVariable(namespace, key) {
    return config.variables?.find((variable) =>
        variable.namespace === namespace
        && variable.key === key
        && !variable.mode
    )?.value
}

export default function Page() {
    const color = getVariable('color', 'e2e')
    const screen = getVariable('screen', 'fixture')

    return (
        <main data-color={color} data-screen={screen}>
            {color}:{screen}
        </main>
    )
}
