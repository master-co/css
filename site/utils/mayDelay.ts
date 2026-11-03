export const mayDelay = (cb: () => any, ms: number) => {
    return ms ? setTimeout(cb, ms) : cb()
}