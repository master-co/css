export default function Componennt() {
    const a = "hello"
    return (
        <div className={`block text:center font:fd fg:#${a || 'block'}`}></div>
    )
}