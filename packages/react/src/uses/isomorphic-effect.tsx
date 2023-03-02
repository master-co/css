import { useEffect, useLayoutEffect } from 'react'

export const useIsomorphicEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect
