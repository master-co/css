import DocTable from "../DocTable";
import { Style, StyleSheet } from '@master/css';
import { render } from '@master/css/render';
import { Fragment } from "react";
import MdnButton from "../MdnButton";
import CanIUseButton from "../CanIUseButton";
import Code from "../Code";
require('css.escape')

const ReferenceTable = (props: any) => {
    const { title, names } = props
    return (
        <DocTable {...props}>
            <thead>
                <tr>
                    <th className="sticky top:0 z:1 bg:white bg:gray-16@dark">{title || 'name'}</th>
                    {
                        names.find((eachName: any) => eachName.code) &&
                        <th className="sticky top:0 z:1 bg:white bg:gray-16@dark">properties</th>
                    }
                    <th className="sticky top:0 z:2 bg:white bg:gray-16@dark">description</th>
                    <th className="sticky top:0 z:3 bg:white bg:gray-16@dark w:0"></th>
                </tr>
            </thead>
            <tbody className='f:12_code v:top_td'>
                {names.map((eachName: any, index: number) => (
                    <tr key={index}>
                        <td>
                            <code dangerouslySetInnerHTML={{ __html: processClassName(eachName) }}
                                className="key-code white-space:nowrap">
                            </code>

                        </td>
                        {
                            eachName.code &&
                            <td>
                                <Code lang="css" inline={true} pretty={true}>
                                    {eachName.code}
                                </Code>
                            </td>
                        }
                        <td>
                            <p className="t:14" dangerouslySetInnerHTML={{ __html: eachName.description }}></p>
                        </td>
                        <td className='white-space:nowrap'>
                            {
                                eachName.hiddenRef ? null :
                                    <>
                                        <CanIUseButton src={eachName.caniuse} className="r:5 my:-2 mr:5 v:top" width="24" height="24"></CanIUseButton>
                                        <MdnButton src={eachName.mdn || eachName.name.replace(new RegExp(/(\({1}.*\){1})/), '')} className="r:5 my:-2 v:top" width="24" height="24"></MdnButton>
                                    </>
                            }

                        </td>
                    </tr>
                ))}
            </tbody>
        </DocTable>
    )
};

const processClassName = (classname: string | Record<string, any>): string => {
    if (typeof classname === 'object') {
        classname = classname.name;
    }

    return classname.replace(/`(.*?)`/g, '<i class=\'f:fade f:gray-70@dark\'>$1</i>')
}

export default ReferenceTable;