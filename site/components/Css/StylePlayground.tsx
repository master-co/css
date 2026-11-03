import { Style } from "@master/css";
import { useRef, useState, useCallback } from "react";
import { cls } from '~/utils/cls';
import StyleEditor from "./StyleEditor";

const StylePlayground = () => {
    const inputRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLElement>(null)
    const [className, setClassName] = useState<string>('font:heavy font:24@md hide@print')
    const [name, setName] = useState<string>('')
    const styleEditorRef = useCallback(node => {
        if (node) {
            setName(node.name)
        }
    }, [])

    const toggle = () => {
        editorRef.current?.classList.toggle('hide')
        setTimeout(() => {
            const element = inputRef.current;
            if (element) {
                element.focus()
                element.textContent = className;
                const selection = window.getSelection()
                if (selection) {
                    selection.selectAllChildren(element)
                }
            }
        })
    }

    return (
        <>
            <button onClick={toggle}
                className={cls`
                    fixed z:100 w:40 h:40 bottom:15 right:15 r:3 flex center-content 
                    bg:white@light bg:gray-98/.08@dark bg:gray-98/.12:hover@dark bg:fade-90:hover@light
                    b:1|solid|white/.04@dark b:1|solid|fade-88@light
                    f:semibold bd:blur(12)
                `}>
                <svg xmlns="http://www.w3.org/2000/svg"
                    enableBackground="new 0 0 24 24"
                    height="20"
                    viewBox="0 0 24 24"
                    width="20" className="fill:gray-60@dark fill:fade-50@light">
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                </svg>
            </button>
            <aside ref={editorRef}
                className={cls`
                    fixed z:1060 right:15 bottom:65 
                    bg:white@light bg:gray-22@dark 
                    r:5 w:calc(100%-30px) max-w:600
                    b:1|solid|white/.04@dark hide
                    max-h:calc(100%-80px)
                    overflow:hidden overflow-y:auto contain:content
                    scrollbar
                `}
                style={{
                    boxShadow: `
                        0px 0px 2.2px rgba(0, 0, 0, 0.026),
                        0px 0px 5.3px rgba(0, 0, 0, 0.037),
                        0px 0px 10px rgba(0, 0, 0, 0.043),
                        0px 0px 17.9px rgba(0, 0, 0, 0.048),
                        0px 0px 33.4px rgba(0, 0, 0, 0.053),
                        0px 0px 80px rgba(0, 0, 0, 0.07)
                    `
                } as any}>
                <div className="flex flex:col order:2>code order:1>.demo mt:0!_pre b:0!_pre r:0!_:where(.demo,pre) m:0>.demo m:20>code bx:0>.demo bg:transparent!_pre">
                    <StyleEditor ref={styleEditorRef}
                        className={className}
                        tag="div"
                        showCss
                        hideTagInput>
                        <div className={name}>Hello world</div>
                    </StyleEditor>
                </div>
                <div ref={inputRef}
                    className="
                        token attr-value
                        outline:0 f:mono t:14 p:20
                        content:attr(aria-placeholder):empty:before
                        f:fade-66:empty:before f:gray:empty:before@dark
                    "
                    aria-placeholder="Try some class names ..."
                    spellCheck="false"
                    contentEditable
                    style={{ WebkitUserModify: 'read-write-plaintext-only' }}
                    onInput={(event: any) => {
                        setClassName(event.target.textContent
                            .replace(/\n/g, ' ')
                            .split(' ')
                            .filter((eachClassName: string) => !(eachClassName in Style.classes))
                            .join(' '));
                    }}>
                </div>
            </aside>
        </>
    )
};

export default StylePlayground;