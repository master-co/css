import React from 'react';

type baseType = string | number | Record<string, boolean>;
type baseLoopType = baseType | Array<baseType>;
type extraType = { className?: baseLoopType | undefined, [key: string]: any };
const el: {
    [key in keyof JSX.IntrinsicElements]: (defaultClassNames: TemplateStringsArray, ...params: Array<((props: Omit<JSX.IntrinsicElements[key], 'className'> & extraType) => baseLoopType | undefined) | baseLoopType>) => React.FunctionComponent<Omit<JSX.IntrinsicElements[key], 'className'> & extraType>
} = new Proxy(
    {} as any,
    {
        get: function (target, Tag: string) {
            if (!(Tag in target)) {
                target[Tag] = (() => {
                    return (defaultClassNames: TemplateStringsArray, ...params: any[]) => {
                        function component(props: any) {
                            const newParams = [...params];
                            for (let i = 0; i < newParams.length; i++) {
                                if (typeof newParams[i] === 'function') {
                                    newParams[i] = newParams[i](props) || '';
                                }
                            }
                
                            return <Tag {...props} className={clsx($(defaultClassNames, ...newParams), props.className)} />;
                        }
                        component.displayName = Tag;
                
                        return component;
                    };
                })();
            }
            return target[Tag];
        }
    }
);

function $(defaultClassNames: TemplateStringsArray, ...params: baseLoopType[]) {
    let newClassName = '';
    for (let i = 0; i < defaultClassNames.length; i++) {
        newClassName += defaultClassNames[i];

        if (i < params.length) {
            newClassName += clsx(params[i]);
        }
    }
    return newClassName;
}

function clsx(...args: any[]) {
    const results: any[] = [];

    const handleDeep = (value: any) => {
        if (value) {
            if (typeof value === 'string' || typeof value === 'number') {
                results.push(value);
            } else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    for (const eachVal of value) {
                        handleDeep(eachVal);
                    }
                } else {
                    for (const key in value) {
                        if (value[key]) {
                            results.push(key);
                        }
                    }
                }
            }
        }
    };

    for (const eachArg of args) {
        handleDeep(eachArg);
    }

    return results.join(' ');
}

export { el, $ };