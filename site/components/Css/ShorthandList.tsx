const ShorthandList = ({ items }: any) => {
    return (
        items &&
        <ul>
            {items
                .map((eachItem: any, index: number) =>
                    <li key={index}>
                        <a href={eachItem.url || eachItem || ''}>{eachItem.name || eachItem}</a>
                    </li>
                )}
        </ul>
    )
};
export default ShorthandList;