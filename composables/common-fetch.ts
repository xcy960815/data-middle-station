


/**
 * @desc 封装一个基于fetch的通用请求方法
 */
export class commonFetch {
    static baseUrl: string;
    constructor() {
        commonFetch.baseUrl = "https://api.github.com";
    }
    //   async fetch(url, options) {
    //     const response = await fetch(`${this.baseUrl}${url}`, options);
    //     if (!response.ok) {
    //       throw new Error(response.statusText);
    //     }
    //     return response.json();
    //   }
}