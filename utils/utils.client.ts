/**
 * @desc 用于客户端端的工具函数
 */

/**
 * @desc 判断是否为Chrome浏览器
 * @returns boolean
 */
export const isChrome = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('chrome') > -1;
};

/**
 * @desc 休眠函数
 * @param {number} timer
 * @returns Promise<void>
 */
export function clienSleep(timer: number): Promise<void> {
  return new Promise<void>((resolved) => {
    setTimeout(() => {
      resolved();
    }, timer);
  });
}

/**
 * @desc 获取文本宽度
 * @param innerText {string}
 * @returns {number}
 */
export const getTextWidth = (innerText: string): number => {
  if (process.client) {
    const span = document.createElement('span') as HTMLSpanElement;
    span.innerText = innerText;
    span.className = `get-text-width-${innerText.length}-${Math.random()}`; // Use individualized class name
    // 向body添加每一行的节点 获取节点的宽度 完成之后在移除节点
    document.body.appendChild(span);
    const width = span.offsetWidth; // use the direct reference to the newly created element
    span.remove();
    return width;
  }
  return 0;
};

/**
 * @desc 遍历列的所有内容，获取最宽一列的宽度
 * @param strings {Array<string>}
 * @returns {number}
 */
export const getMaxLength = (strings: Array<string>) => {
  return strings.reduce((maxWidth, item) => {
    if (item) {
      const currentWidth = getTextWidth(item);
      if (maxWidth < currentWidth) {
        maxWidth = currentWidth;
      }
    }
    return maxWidth;
  }, 0);
};

/**
 * @desc 获取当前时间
 */
// 格式化数据，传入源数据与 formatConfig，输出格式化后数据
export const formatData = (sourceData, formatConfig) => {
  if (!formatConfig) {
    return sourceData;
  }

  try {
    switch (formatConfig.cateId) {
      case 1:
      case 2: {
        if (sourceData || sourceData === 0) {
          return numbro(sourceData).format(generatenumbroFormatCode(formatConfig));
        } else {
          return ''; // 没有值的填空
        }
      }
      case 3: {
        if (formatConfig.fen2yuan) {
          sourceData = Number(sourceData) / 100;
        }
        if (formatConfig.currency !== 'custom') {
          numbro.setLanguage(formatConfig.currency);
          return numbro(sourceData).formatCurrency(generatenumbroFormatCode(formatConfig));
        } else {
          return formatConfig.customCurrencySymbol + numbro(sourceData).format(generatenumbroFormatCode(formatConfig));
        }
      }
      case 4: {
        // const timeReg = /^[0-9,/:-\s]+$/;
        // if (isNaN(sourceData) && !isNaN(Date.parse(sourceData))) {
        return moment(sourceData).format(formatConfig.dateFormat);
        // } else {
        //     return '无效的日期';
        // }
        // 判断 sourceData  是否是 日期类型
        // if (isDate(sourceData)) {
        //     return moment(sourceData).format(formatConfig.dateFormat);
        // } else {
        //     return '无效的日期';
        // }
      }
      case 5: {
        let value = sourceData; // wtf ????
        return eval('`' + formatConfig.tpl + '`');
      }
      case 6: {
        // 链接跳转
        const color = formatConfig.color;
        const blank = formatConfig.target === '_blank' ? 'target="_blank"' : 'target="_self"';
        const url = formatConfig.url.replace(/\$\{value\}/g, sourceData);
        const href = url ? `href="${url}"` : '';
        return `<a ${href}  style="color:${color}" ${blank}>${sourceData}</a>`;
      }
      case -1:
      default: {
        return sourceData;
      }
    }
  } catch (e) {
    console.log(e);
    return sourceData;
  }
}

