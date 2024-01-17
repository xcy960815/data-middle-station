

const specialKeys = ['order', 'group'];

/**
 * @desc 获取对象的属性
 * @param rowData {Object}
 * @returns {{keys: string[], values: (string | number)[]}}}
 */
export function getObjectProperties<T extends { [key: string]: any }>(rowData: T): { keys: string[], values: (string | number)[] } {
    const keys: string[] = [];
    const values: (string | number)[] = [];
    for (let k in rowData) {
        if (typeof rowData[k] !== 'undefined') {
            const value = rowData[k];
            // 将 k 由 驼峰 转为 下划线
            const underlineKey = k.replace(/([A-Z])/g, "_$1").toLowerCase();
            // order group 字段单独处理一下
            if (specialKeys.includes(underlineKey) && typeof value === 'string') {
                keys.push('\`' + underlineKey + '\`');
            } else {
                keys.push(underlineKey);
            }
            if (typeof value === 'object' && value !== null) {
                values.push(JSON.stringify(value));
            } else {
                values.push(value);
            }
        }
    }
    return {
        keys,
        values
    };
}
