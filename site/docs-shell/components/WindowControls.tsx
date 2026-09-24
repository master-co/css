export default function WindowControls() {
  return ['EC6A5F', 'F4BF50', '61C454'].map((color) =>
    <svg key={color} className={'w:10px h:10px inline-block mx:0.188rem round vertical-align:middle ' + 'bg:#' + color}></svg>
  )
}
