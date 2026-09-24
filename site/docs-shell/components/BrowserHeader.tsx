import WindowControls from './WindowControls'

const BrowserHeader = ({ url }: any) => {
  return (
    <div className="flex w:100% p:var(--spacing-xs)|var(--spacing-sm) rtl:5px rtr:5px backdrop-filter:blur(1px) contain:content {rtl:0px;rtr:0px;mt:0;border-top-width:0px}+.demo">
      <div className="w:25%">
        <WindowControls />
      </div>
      <div className="flex items-center justify-center w:50% font-xs">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 30 30" width="12" height="12"
          className="mr-2xs opacity:.5">
          <path
            d="M 15 2 C 11.145666 2 8 5.1456661 8 9 L 8 11 L 6 11 C 4.895 11 4 11.895 4 13 L 4 25 C 4 26.105 4.895 27 6 27 L 24 27 C 25.105 27 26 26.105 26 25 L 26 13 C 26 11.895 25.105 11 24 11 L 22 11 L 22 9 C 22 5.2715823 19.036581 2.2685653 15.355469 2.0722656 A 1.0001 1.0001 0 0 0 15 2 z M 15 4 C 17.773666 4 20 6.2263339 20 9 L 20 11 L 10 11 L 10 9 C 10 6.2263339 12.226334 4 15 4 z" />
        </svg>
        <span className="clamp-lines:1 leading:1 text-muted">{url}</span>
      </div>
      <div className="w:25%"></div>
    </div>
  )
}

export default BrowserHeader
