import { Dispatch, forwardRef, Fragment, SetStateAction, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cls } from '~/utils/cls';
import Code from '../Code';
import clearCodeTokens from '~/utils/clearCodeTokens';
import clsx from 'clsx';
import { beautifyCss } from '~/utils/beautifyCss';
import { CloneStyleSheet } from '~/utils/clone-style-sheet';
import { render } from '@master/css/render';

const StyleEditor = forwardRef(({
    hideTagInput,
    tag,
    className,
    attrs,
    min,
    max,
    step,
    value,
    hideBadges,
    names,
    omitPrefix,
    demoClassName,
    showCss,
    hideHtml,
    autofocus,
    children,
    renderHtml
}: any, ref) => {
    if (!tag) {
        tag = 'div';
    }

    const nameInputRef = useRef<HTMLInputElement>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getName = (className: Function | string) => {
        const classNames = typeof className === 'function' ? className(value) : className;
        return classNames ? (Array.isArray(classNames) ? classNames[0] : classNames).trim() : '';
    };
    const [name, setName] = useState<string>(getName(className));

    const getCss = useCallback(() => render(`<p class="${name}">`, { StyleSheet: CloneStyleSheet }).css, [name]);
    const [css, setCss] = useState<string>(getCss());
    const [html, setHtml] = useState<string | null>(renderHtml?.(name));

    let setValue: Dispatch<SetStateAction<number>>;
    [value, setValue] = useState<number>(value);

    useImperativeHandle(ref, () => ({ name, value }));

    const applyClass = (className: Function | string) => {
        const newName = getName(className);
        setName(newName);
    };

    const focus = () => {
        setTimeout(() => {
            if (nameInputRef.current) {
                const range = document.createRange().cloneRange();
                range.selectNodeContents(nameInputRef.current);
                range.collapse();

                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        })
    }

    const processDisplayName = (name: string) => {
        return omitPrefix
            ? name.replace(omitPrefix, '')
            : name;
    }

    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.textContent = name;
        }

        setCss(getCss());

        const renderedHtml = renderHtml?.(name);
        if (renderedHtml) {
            setHtml(renderedHtml);
        }
    }, [name, getCss, renderHtml]);

    useEffect(() => {
        setName(getName(className));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [className]);

    useEffect(() => {
        if (autofocus) {
            focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {!hideTagInput &&
                <code className="language-html f:16 flex align-items:center my:10">
                    {tag &&
                        <>
                            <span className="token punctuation">&lt;</span>
                            <span className="token tag">{tag}&nbsp;</span>
                        </>
                    }
                    <span className="token attr-name">class</span>
                    <span className="token attr-value">
                        <span className="token punctuation attr-equals mx:0.1em">=</span>
                        <span className="token punctuation">&quot;</span>
                        <span className="bg:transparent outline:0 f:mono h:2rem t:center px:20 mx:-20"
                            ref={nameInputRef}
                            onBlur={() => {
                                if (nameInputRef.current && !nameInputRef.current?.textContent) {
                                    applyClass(className)
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.keyCode === 13) {
                                    event.preventDefault()
                                }
                            }}
                            onInput={(event: any) => {
                                applyClass(event.target.textContent)
                            }}
                            onClick={(event) => event.stopPropagation()}
                            spellCheck={false}
                            contentEditable>
                        </span>
                        <span className="token punctuation">&quot;</span>
                    </span>
                    {
                        attrs && Object.keys(attrs).map(attrKey => (
                            <Fragment key={attrKey}>
                                <span className="token attr-name">&nbsp;{attrKey}</span>
                                {attrs[attrKey] &&
                                    <span className="token attr-value">
                                        <span className="token punctuation attr-equals mx:0.1em">=</span>
                                        <span className="token punctuation">&quot;</span>{attrs[attrKey]}<span className="token punctuation">&quot;</span>
                                    </span>
                                }
                            </Fragment>
                        ))
                    }
                    {tag && <span className="token punctuation">&gt;</span>}
                </code>
            }
            {(min || max) &&
                <input type="range"
                    className="w:full mb:10 mt:-3 block"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onInput={(event: any) => setValue(event.target.value)} />
            }
            {!hideBadges && names?.length > 1 &&
                <div className="flex flex:wrap gap:5 mt:10 mb:-8">
                    {
                        names.map((eachName: string) => (
                            <button className={cls`
                                bg:fade-90 bg:fade-88:hover bg:gray-20@dark bg:gray-22:hover@dark r:3 px:7 f:mono h:1.5rem f:12 cursor:pointer
                            `}
                                type="button"
                                key={eachName}
                                onClick={() => {
                                    applyClass(eachName)
                                    focus()
                                }}>
                                <code>{processDisplayName((Array.isArray(eachName) ? eachName[0] : eachName))}</code>
                            </button>
                        ))
                    }
                </div>
            }
            {(children || html) &&
                <div className={clsx('demo', demoClassName, { 'mb:0!': showCss })}
                    dangerouslySetInnerHTML={html ? { __html: clearCodeTokens(html) } : undefined}>
                    {children}
                </div>
            }
            {!hideHtml && html && <Code lang="html">{html}</Code>}
            {showCss && css &&
                <div className="rel opacity:1:hover_label">
                    <Code lang="css" className="my:0">{beautifyCss(css)}</Code>
                    <label className="abs right:12 top:12 f:12 f:fade-78 opacity:0 f:gray-32@dark italic">
                        automatically
                    </label>
                </div>
            }
        </>
    )
})
StyleEditor.displayName = 'StyleEditor';

export default StyleEditor