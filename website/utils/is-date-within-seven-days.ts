export default function isDateWithinSevenDays(dateString: string) {
    // 获取当前日期
    const currentDate = new Date()

    // 将字符串转换为日期对象
    const date = new Date(dateString)

    // 计算日期差异（以毫秒为单位）
    const difference = currentDate.getTime() - date.getTime()

    // 将毫秒转换为天数
    const daysDifference = Math.ceil(difference / (1000 * 3600 * 24))

    // 判断是否在7天内
    return daysDifference < 7
}