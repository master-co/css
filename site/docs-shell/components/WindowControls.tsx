export default function WindowControls() {
  return ['EC6A5F', 'F4BF50', '61C454'].map((color) =>
    <svg key={color} className={'width:10px height:10px display:inline-block margin-inline:0.188rem round vertical-align:middle ' + 'background-color:#' + color}></svg>
  )
}
