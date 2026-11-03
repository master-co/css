import { useEffect, useState } from 'react'

const ImageRange = ({ imageClass, className , showCover ,children}: any) => {

    const [value, setValue] = useState('10');
    const [renderClassName, setRenderClassName] = useState('');

    const onClassNameChange = (changeValue:any)=>{
        setRenderClassName(className.replace('`value`',changeValue));
        setValue(changeValue)
    }

    useEffect(()=>{
        onClassNameChange(value)
    })

    return (
        <>
            <code className="f:12">{ renderClassName }</code>
            <div className={`mt:10 h:150 aspect:1/1 p:20 ${imageClass} ${showCover ? null : renderClassName}!`}>
                {
                    showCover ? 
                        <div className={`h:full bg:gray-90/.5 flex align-items:center ${renderClassName}`}></div> 
                        : null
                }
                 { children || null}
            </div>
             {
                className.includes('`value`') ? 
                    <div className="block">
                        <input type="range"
                            className="mt:10 w:full"
                            defaultValue={value}
                            min="0"
                            max="100"
                            step="10"
                            onChange={(event) => onClassNameChange(event.target.value)} /> 
                    </div>
                    : null
            }
        </>
    )
}

export default ImageRange