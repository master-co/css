export default function delay(time = 0) {
    return new Promise((resolve) => {
        setTimeout(resolve, time)
    })
}