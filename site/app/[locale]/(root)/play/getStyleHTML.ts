export function getStyleHTML({ src, text }: any) {
    return text
        ? `<style type="text/css">${text}</style>`
        : `<link rel="stylesheet" type="text/css" href="${src}">`
}