



declare namespace StringUtils {
    // /**
    //  * @desc 获取文本宽度
    //  * @param innerText {string}
    //  * @example const width = stringUtils.getTextWidth('hello');
    //  * @returns {number}
    //  */
     /**
     * Get the formatted date according to the string of tokens passed in.
     *
     * To escape characters, wrap them in square brackets (e.g. [MM]).
     * ```
     * dayjs().format()// => current date in ISO8601, without fraction seconds e.g. '2020-04-02T08:02:17-05:00'
     * dayjs('2019-01-25').format('[YYYYescape] YYYY-MM-DDTHH:mm:ssZ[Z]')// 'YYYYescape 2019-01-25T00:00:00-02:00Z'
     * dayjs('2019-01-25').format('DD/MM/YYYY') // '25/01/2019'
     * ```
     * Docs: https://day.js.org/docs/en/display/format
     */
    type getTextWidth = (innerText: string) => number;

    /**
     * @desc 遍历列的所有内容，获取最宽一列的宽度
     * @param strings {Array<string>}
     * @example const width = stringUtils.getMaxLength(['hello', 'world']);
     * @returns {number}
     */
    type getMaxLength = (strings: Array<string>) => number;
}