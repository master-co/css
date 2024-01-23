'use client'

import { useCallback, useRef, useState } from 'react'
import DocTable from 'websites/components/DocTable'
import { snackbar } from '../../../../utils/snackbar'

export default function SyntaxTable({ title, value, children, scrollY, addedLabels, ...props }: any) {
    const [previewCodeElement, setPreviewCodeElement] = useState<HTMLElement | null>(null)
    const [shouldSelected, setShouldSelected] = useState<boolean | undefined>()
    const tbodyRef = useRef<HTMLTableSectionElement>(null)
    const copySyntax = useCallback((event: any) => {
        const codeElement = event.target.closest('.language-mcss:not(.invalid)')
        const textContent = codeElement?.textContent
        if (textContent) {
            let _shouldSelected = shouldSelected
            if (previewCodeElement) {
                previewCodeElement.classList.remove('text:underline')
            } else {
                const firstSelectedCode = tbodyRef.current?.querySelector('.language-mcss.text\\:underline')
                if (firstSelectedCode) {
                    firstSelectedCode?.classList.remove('text:underline')
                    _shouldSelected = true
                    setShouldSelected(true)
                }
            }
            if (_shouldSelected) {
                codeElement.classList.add('text:underline')
                setPreviewCodeElement(codeElement)
                window.dispatchEvent(new CustomEvent('change:preview-syntax', { detail: textContent }))
            }
            snackbar('<code class="font:90% font:semibold ls:-.5">' + textContent + '</code> copied')
            navigator.clipboard.writeText(textContent)
        }
    }, [previewCodeElement, shouldSelected])
    return (
        <>
            <DocTable {...props} className="mb:8x" scrollY={scrollY !== undefined ? scrollY : 424}>
                <thead>
                    <tr>
                        <th className="sticky bg:base top:0 z:1">{title || 'Class'}</th>
                        <th className="sticky bg:base top:0 z:1">Declarations</th>
                        {addedLabels && addedLabels.map((label: string) => <th key={label} className="sticky bg:base top:0 z:1">{label}</th>)}
                    </tr>
                </thead>
                <tbody ref={tbodyRef} onClick={copySyntax} className="text:underline_.language-mcss:not(.invalid):hover">
                    {children}
                </tbody>
            </DocTable>
        </>
    )
}