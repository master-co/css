/** Three neutral window dots; the editor frame stays quiet so the code carries the color. */
export default function WindowControls() {
  return [0, 1, 2].map((index) => <svg aria-hidden="true" className="code-window-dot" key={index} />)
}
