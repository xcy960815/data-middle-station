import dayjs from "dayjs";

/**
 * @desc 获取图表颜色
 * @returns {string[]}
 */
export const getChartColors = () => {
  return [
    '#509EE3',
    '#FF7F0E',
    '#2CA02C',
    '#D62728',
    '#9467BD',
    '#8C564B',
    '#E377C2',
    '#7F7F7F',
    '#BCBD22',
    '#17BECF'
  ]
}


enum formatEnum {
  // 数字
  数字 = 1,
  // 百分比
  百分比 = 2,
  // 货币
  货币 = 3,
  // 时间
  时间 = 4,
  // 链接跳转
  链接跳转 = 5,
  // 自定义
  自定义 = 6,
  // 无格式
  无格式 = -1,
}


type FormatConfig = {
  formatType: formatEnum;
  currency: string;
  customCurrencySymbol: string;
  dateFormat: string;
  template: string;
  color: string;
  target: string;
  url: string;
  fen2yuan: boolean;
}


type Type1RequiredKeys = "name";
type Type2RequiredKeys = "age";
type RequiredKeys<T extends { type: number }> = T["type"] extends 1
  ? Type1RequiredKeys
  : T["type"] extends 2
  ? Type2RequiredKeys
  : never;

interface Test {
  type: 1 | 2 | 3;
  name?: string;
  age?: number;
  email?: string;
}

type ValidateTest<T extends Test> = RequiredKeys<T> extends keyof T
  ? T
  : "Invalid";

// 示例用法：
const test1: ValidateTest<{
  type: 1;
  name: string;
  age?: number;
  email?: string;
}> = {
  type: 1,
  name: "John",
};

const test2: ValidateTest<{
  type: 2;
  name?: string;
  age: number;
  email?: string;
}> = {
  type: 2,
  age: 25,
};

const test3: ValidateTest<{
  type: 3;
  name?: string;
  age?: number;
  email?: string;
}> = {
  type: 3,
};



/**
 * @description 格式化数据，传入源数据与 formatConfig，输出格式化后数据
 * @param sourceData {string | number}
 * @param formatConfig {FormatConfig}
 * @returns {string}
 */
export const formatData = (sourceData: string | number, formatConfig: FormatConfig) => {

  switch (formatConfig.formatType) {
    case 1:
    case 2:
      if (sourceData && typeof sourceData === "number" && !isNaN(sourceData)) {
        return formatConfig.formatType === 1 ? sourceData : sourceData + '%';
      } else {
        return '';
      }
    case 3:
      if (sourceData && typeof sourceData === "number" && !isNaN(sourceData)) {
        return formatConfig.currency + sourceData.toFixed(2);
      } else {
        return '';
      }
    case 4:
      if (isNaN(sourceData as number) && !isNaN(Date.parse(sourceData as string))) {
        return dayjs(sourceData).format(formatConfig.dateFormat);
      } else {
        return '无效的日期';
      }
    case 5:
      return eval('`' + formatConfig.template + '`');
    case 6:
      const color = formatConfig.color;
      const blank = formatConfig.target === '_blank' ? 'target="_blank"' : 'target="_self"';
      const url = formatConfig.url.replace(/\$\{value\}/g, sourceData as string);
      const href = url ? `href="${url}"` : '';
      return `<a ${href}  style="color:${color}" ${blank}>${sourceData}</a>`;
    case -1:
    default: {
      return sourceData;
    }
  }
}
