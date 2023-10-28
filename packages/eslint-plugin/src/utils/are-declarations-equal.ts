export default function areDeclarationsEqual(aDeclarations, bDeclarations) {
    // 获取对象A和B的所有属性名
    const aKeys = Object.keys(aDeclarations)
    const bKeys = Object.keys(bDeclarations)

    // 如果属性数量不相等，返回false
    if (aKeys.length !== bKeys.length) {
        return false
    }

    // 检查对象A的属性是否都存在于对象B中
    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(bDeclarations, key)) {
            return false
        }
        if (aDeclarations[key] !== bDeclarations[key]) {
            return false
        }
    }

    // 如果所有属性都匹配，返回true
    return true
}