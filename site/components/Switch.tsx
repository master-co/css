export default function Switch(props: any) {
    const { disabled, checked, text, comment } = props;
    return (
        <label className="inline-flex align-items:center">
            <input className="switch-input" type="checkbox" {...props} />
            <svg className="switch-toggle">
                <rect className="switch-button" x="2" y="2" rx="14" />
            </svg>
            {text &&
                <span className="ml:8 text:14">
                    {text} {comment && <span className="font:fade-50 font:gray-60@dark">{comment}</span>}
                </span>
            }
        </label>
    )
}