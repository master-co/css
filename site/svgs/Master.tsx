
function MasterSvg(props?: any) {
    const id = 'gradient' + props.id;
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 103.81 56.36">
            <defs>
                <linearGradient id={id} x1="0.5" y1="-1.054" x2="0.5" y2="1.002" gradientUnits="objectBoundingBox">
                    <stop offset="0" stopColor="#c8861c" />
                    <stop offset="0.323" stopColor="#e6a345" />
                    <stop offset="1" stopColor="#f6db9b" />
                </linearGradient>
                <linearGradient id={id + '-2'} x1="21.397" y1="-1.054" x2="21.397" y2="1.002" gradientUnits="objectBoundingBox">
                    <stop offset="0" stopColor="#c78a28" />
                    <stop offset="0.323" stopColor="#e6a345" />
                    <stop offset="1" stopColor="#f6db9b" />
                </linearGradient>
                <linearGradient id={id + '-3'} x1="0.156" y1="-0.44" x2="0.754" y2="1.009" gradientUnits="objectBoundingBox">
                    <stop offset="0" stopColor="#fcdd98" />
                    <stop offset="0.232" stopColor="#fada94" />
                    <stop offset="0.407" stopColor="#f6d48b" />
                    <stop offset="0.564" stopColor="#efc87b" />
                    <stop offset="0.709" stopColor="#e6b864" />
                    <stop offset="0.847" stopColor="#d9a346" />
                    <stop offset="0.975" stopColor="#c98922" />
                    <stop offset="1" stopColor="#e6a345" />
                </linearGradient>
                <clipPath id="clip-logo">
                    <rect width="103.81" height="56.36" />
                </clipPath>
            </defs>
            <g id="logo" clipPath="url(#clip-logo)">
                <g id="Group_23" data-name="Group 23" transform="translate(-0.001)">
                    <path id="Path_1" data-name="Path 1" d="M596.576,177.487c-2.716-4.806-5-5.52-7.227-5.52-3.27,0-5.542,3.023-6.994,5.705l-5.8,11.91,1.58,2.591a21.636,21.636,0,0,0,29.112,9.135l1.507-.786Z" transform="translate(-504.941 -147.386)" fill={'url(#' + id + ')'} />
                    <path id="Path_2" data-name="Path 2" d="M528.344,177.487c2.716-4.806,5-5.52,7.228-5.52,3.268,0,5.54,3.023,6.993,5.705l5.8,11.91-1.579,2.591a21.636,21.636,0,0,1-29.112,9.135l-1.507-.786Z" transform="translate(-516.166 -147.386)" fill={'url(#' + id + '-2)'} />
                    <path id="Path_3" data-name="Path 3" d="M593,157.726c-4.229-8.53-16.922-8.723-21.225-.129l-6.252,11.974L559.266,157.6c-4.3-8.594-16.995-8.4-21.225.129l-8.134,15.738c3.861-4.383,9.276-1.8,11.631,2.66l8.773,16.148,4.487,8.581a11.893,11.893,0,0,0,5.11,5.2,12.414,12.414,0,0,0,11.221,0,11.9,11.9,0,0,0,5.109-5.2l4.487-8.581,8.773-16.148c2.356-4.46,7.77-7.043,11.631-2.66Z" transform="translate(-513.612 -151.239)" fill={'url(#' + id + '-3)'} />
                </g>
            </g>
        </svg>
    )
}

export default MasterSvg