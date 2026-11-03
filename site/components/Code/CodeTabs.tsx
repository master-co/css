import clsx from 'clsx';
import { useState } from 'react';
import Code from '.';
import CodeTabBar from './CodeTabBar'

const CodeTabs = (props?: any) => {
    let [current, setCurrent] = useState(props.children[0])

    return (
        <div className={clsx('codeTabs mt:20 {bt:0!;rt:0}_pre flex flex:col {my:0;flex:1}_.code', props.className)}>
            <CodeTabBar
                className={props.tabBarClassName}
                currentName={current.name}
                currentCode={current.code}
                tabs={props.children}
                onTabChange={(event: Event, name: string) => {
                    setCurrent(props.children.find((child: any) => child.name == name))
                }} />
            {
                props.children.map((child: any) => (
                    current.name === child.name && (
                        <Code key={child.code} {...child} name="">
                            {child.code}
                        </Code>
                    )
                ))
            }
        </div>
    )
}

export default CodeTabs
