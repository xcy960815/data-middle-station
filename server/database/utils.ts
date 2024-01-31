




/**
 * @desc 下划线转驼峰
 * @param name {string} 下划线字符串
 * @returns {string}
 */
export const toHump = (name: string) => {
    return name.replace(/\_(\w)/g, function (all, letter) {
        return letter.toUpperCase();
    });
}

/**
 * @desc 驼峰转下划线
 * @param name {string} 驼峰字符串
 * @returns {string}
 */
export const toLine = (name: string) => {
    return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}