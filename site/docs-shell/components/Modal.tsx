export default function Modal({ contentClass, backdropClick, children }: any) {
  return <div className="position:fixed inset:0 z-index:1060 display:flex align-items:center justify-content:center padding:0.625rem animation:fade|.3s contain:strict">
    <svg className="position:absolute inset:0 z-index:-1 full background-color:rgb(0,0,0,.5) contain:strict" onClick={events => backdropClick(events)}></svg>
    <div className={`surface-raised border-radius:5px width:100% position:relative ${contentClass}`}
      style={{ boxShadow: 'rgb(0 0 0 / 20%) 0px 11px 15px -7px, rgb(0 0 0 / 14%) 0px 24px 38px 3px, rgb(0 0 0 / 12%) 0px 9px 46px 8px' }}>
      {/* <svg className="position:absolute right:10px top:10px fill-neutral-50@site-dark fill-neutral-60@site-light"
        xmlns="http://www.w3.org/2000/svg"
        width="24px"
        height="24px"
        viewBox="0 0 24 24">
        <path
          d="M13.414 12l4.95-4.95a1 1 0 0 0-1.414-1.414L12 10.586l-4.95-4.95A1 1 0 0 0 5.636 7.05l4.95 4.95-4.95 4.95a1 1 0 0 0 1.414 1.414l4.95-4.95 4.95 4.95a1 1 0 0 0 1.414-1.414z" />
      </svg> */}
      {children}
    </div>
  </div>
}