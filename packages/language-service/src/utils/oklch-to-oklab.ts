
export function oklchToOklab([l, c, h]): any {
    return [
        l,
        c * Math.cos(h * Math.PI / 180),
        c * Math.sin(h * Math.PI / 180),
    ]
}