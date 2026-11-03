import Code from "../Code";
import DocTable from "../DocTable";
import { StyleSheet } from '@master/css';
import { render } from '@master/css/render';
import { Fragment } from "react";
import { beautifyCss } from '~/utils/beautifyCss';
import { CloneStyleSheet } from '~/utils/clone-style-sheet';

require('css.escape')

const ClassTable = ({ title, names, classClick, cheats, children }: any) => {
    return (
        <DocTable>
            <thead>
                <tr>
                    <th className="sticky top:0 z:1 bg:white bg:gray-16@dark">{title || 'class'}</th>
                    <th className="sticky top:0 z:2 bg:white bg:gray-16@dark">properties</th>
                </tr>
            </thead>
            <tbody className='f:12_code'>
                {names.map((eachName: string, index: number) => (
                    <tr key={index}>
                        <td>
                            {(Array.isArray(eachName) ? eachName : [eachName]).map((eachInnerName, i, array) => (
                                <Fragment key={eachInnerName}>
                                    <code onClick={classClick?.(eachInnerName)}
                                        dangerouslySetInnerHTML={{ __html: processClassName(eachInnerName) }}
                                        className="key-code white-space:nowrap font:regular">
                                    </code>
                                    {(i !== array.length - 1) && <code className="f:gray!@dark f:fade-88!"> / </code>}
                                </Fragment>
                            ))}
                        </td>
                        <td>
                            {eachName && processCssText(eachName) &&
                                <Code lang="css" inline={true}>
                                    {processCssText(eachName)}
                                </Code>
                            }
                        </td>
                    </tr>
                ))}
                {children}
            </tbody>
            {/* <!-- cheats --> */}
            {cheats?.length &&
                <>
                    <thead>
                        <tr>
                            <th className="sticky top:-6 z:1 bg:gray-98 bg:gray-10@dark pt:15" colSpan={2}>cheat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cheats.map((tip: any) => (
                            <tr key={tip}>
                                <td>
                                    {(Array.isArray(tip.class) ? tip.class : [tip.class]).map((tipClass: string, i: number, array: string[]) => (
                                        <Fragment key={tipClass}>
                                            <code onClick={classClick?.(tipClass)}
                                                dangerouslySetInnerHTML={{ __html: processClassName(tipClass) as any }}
                                                className="key-code white-space:nowrap">
                                            </code>
                                            {(i !== array.length - 1) && <code className="f:gray!@dark f:fade-88!"> / </code>}
                                        </Fragment>
                                    ))}
                                </td>
                                <td dangerouslySetInnerHTML={{ __html: tip.effect }} className="t:14"></td>
                            </tr>
                        ))}
                    </tbody>
                </>
            }
        </DocTable>
    )
};

const processClassName = (classname: string | Record<string, any>): string => {
    if (typeof classname === 'object') {
        classname = classname.name;
    }

    return classname.replace(/`(.*?)`/g, '<i class=\'f:fade f:gray-70@dark\'>$1</i>')
}

const processCssText = (name: string | Record<string, any>) => {
    const target = (Array.isArray(name)
        ? name[0]
        : name)

    let text = typeof target === 'object'
        ? '.' + CSS.escape(target.name) + '{' + target.proxy + '}'
        : render(`<p class="${target}">`, { StyleSheet: CloneStyleSheet })
            .css;

    if (!text) return

    text = beautifyCss(text)

    return text?.replace(/\..*(?:\\}|\\}\\\))(?={.*:[^}]*})/, '')
        .replace(/.*{(.*)}.*/gs, '$1')
        .replace(/`(.*?)`/g, `ClAsStAbLe$1ClAsStAbLe`)
}

export default ClassTable;