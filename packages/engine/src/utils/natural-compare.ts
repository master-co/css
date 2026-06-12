const naturalCollator = new Intl.Collator(undefined, { numeric: true })

export default naturalCollator.compare
