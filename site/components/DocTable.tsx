import clsx from 'clsx';
import { useEffect, useRef } from "react";
import { cls } from "~/utils/cls";

const DocTable = ({ showBorderTop, children, noScroll, className }: any) => {

    const tableRef = useRef<HTMLTableElement>(null)

    useEffect(() => {
        if (!noScroll && window.ResizeObserver && tableRef.current) {
            const element = tableRef.current;

            const resizeObserver = new ResizeObserver((entries) => {
                const pr = 'pr:10@supports_selector(::scrollbar)';
                /* >1 是為了修正瞬間高度變化誤差導致無限循環的問題 */
                if (Math.abs(element.scrollHeight - element.clientHeight) > 1) {
                    element.classList.add(pr)
                } else {
                    element.classList.remove(pr)
                }
            })

            resizeObserver.observe(element)
        }
    }, [noScroll])

    return (
        <div ref={tableRef} className={clsx(
            'block contain:content pr:0@print',
            { 'max-h:424 overflow-y:auto scrollbar': !noScroll },
            className
        )}>
            {showBorderTop && <hr className="sticky top:1 bb:solid|1|fade-8/.1 b:fade-90/.1@dark contain:strict" />}
            <table className="docTable">
                {children}
            </table>
            <hr className="sticky bottom:1 left:0 bb:solid|1|fade-8/.1 b:fade-90/.1@dark contain:strict my:0!" />
        </div>
    )
};

export default DocTable;