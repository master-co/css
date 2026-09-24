const Dropped = ({ p1, p2, target }: any) => {
  if (!p1 || !p2) {
    return (<></>)
  }
  p1 = p1.trim()
  p2 = p2.trim()
  if (target === 'class') {
    p1 = p1.replace(/.*class="(.*)".*/gm, '$1')
    p2 = p2.replace(/.*class="(.*)".*/gm, '$1')
  }
  return (
    <small className="font-weight:460 text:success">↓ {
      Math.round(Math.abs((p1.length - p2.length) / p1.length) * 100)
    }% code</small>
  )
}

export default Dropped