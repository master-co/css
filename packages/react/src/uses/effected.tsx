import { useEffect, useState } from 'react'

export const useEffected = () => {
    const [effected, setEffected] = useState(false)
    useEffect(() => setEffected(true), [])
    return effected
}