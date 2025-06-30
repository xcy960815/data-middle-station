/**
 * @desc 获取文本宽度
 * @param innerText {string}
 * @returns {number}
 */
export const getTextWidth = (innerText: string): number => {
  if (process.client) {
    const span = document.createElement(
      'span'
    ) as HTMLSpanElement
    span.innerText = innerText
    span.className = `get-text-width-${innerText.length}-${Math.random()}` // Use individualized class name
    // 向body添加每一行的节点 获取节点的宽度 完成之后在移除节点
    document.body.appendChild(span)
    const width = span.offsetWidth // use the direct reference to the newly created element
    span.remove()
    return width
  }
  return 0
}

/**
 * @desc 遍历列的所有内容，获取最宽一列的宽度
 * @param strings {Array<string>}
 * @returns {number}
 */
export const getMaxLength = (
  strings: Array<string>
): number => {
  return strings.reduce((maxWidth, item) => {
    if (item) {
      const currentWidth = getTextWidth(item)
      if (maxWidth < currentWidth) {
        maxWidth = currentWidth
      }
    }
    return maxWidth
  }, 0)
}
