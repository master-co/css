'use client'

import { useCallback } from 'react'

export default function DocVersionSelect({ version }: any) {
    const navigate = useCallback((event: any) => {
        window.location.href = event.target.value
    }, [])
    return <select name="version" defaultValue="https://beta.css.master.co"
        className="abs full cursor:pointer inset:0 opacity:0"
        onChange={navigate}>
        <option value="https://beta.css.master.co">v{version}</option>
        <option value="https://css.master.co">v1.37.3</option>
    </select>
}