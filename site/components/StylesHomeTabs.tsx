import clsx from 'clsx';
import { Children, useState } from 'react';

export default function StylesHomeTabs({ children, defaultName, className }: any) {
    const [name, setName] = useState(defaultName)
    return (
        <div className={clsx('flex overflow-x:auto gap:10 mx:-30@<xs px:20@<xs', className)}>
            {
                Children.map(children, (Child) =>
                    <Child.type {...Child.props}
                        active={name === Child.props.children}
                        onMouseEnter={({ target }: any) => {
                            setName(target.name)
                            Child.props?.onChange?.(target.name)
                        }} />
                )
            }
        </div>
    )
}