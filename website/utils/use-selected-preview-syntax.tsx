'use client'

import { useEffect, useState } from 'react';

export default function useSelectedPreviewSyntax(defaultValue: string) {
    const [previewSyntax, setPreviewSyntax] = useState(defaultValue)
    useEffect(() => {
        const onChange = (event: any) => {
            setPreviewSyntax(event.detail)
        }
        window.addEventListener('change:preview-syntax', onChange, { passive: true })
        return () => window.removeEventListener('change:preview-syntax', onChange)
    }, [])
    return previewSyntax
}