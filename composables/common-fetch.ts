
export interface CommonFetchRequestInit extends RequestInit {
    baseUrl?: string;
    // 请求参数
    requestParams?: any;
    // 请求拦截器
    requestInterceptor?: (requestConfig: CommonFetchRequestInit) => CommonFetchRequestInit;
    // 响应拦截器
    responseInterceptor?: <T>(response: CommonFetchResponse<T>) => CommonFetchResponse<T>;
}



// 支持定义返回的json数据类型
export interface CommonFetchResponse<T = any> extends Response {
    json(): Promise<T>;
}

/**
 * @desc 封装一个基于fetch的通用请求方法
 */
export class commonFetch {

    // 域名
    static baseUrl: string;

    // 携带cookie
    static withCredentials: boolean = false;

    // 超时
    static timeout: number = 10000;


    // 函数重载
    static get<T>(url: string, options?: CommonFetchRequestInit): Promise<CommonFetchResponse<T>>
    static get<T>(url: string, requestParams: Record<string, any>, options?: CommonFetchRequestInit): Promise<CommonFetchResponse<T>>
    /**
     * @desc get请求
     * @param url {string}
     * @param options 
     * @returns 
     */
    static get(url: string, requestParams?: Record<string, any>, options?: CommonFetchRequestInit) {
        if (requestParams) {
            url += `?${new URLSearchParams(requestParams).toString()}`;
        }
        return commonFetch.request(url, {
            method: "GET",
            ...options,
        });
    }


    /**
     * @desc 封装一个基于fetch的通用请求方法
     * @param url {string}
     * @param options 
     * @returns 
     */
    static async request<T = any>(url: string, options: CommonFetchRequestInit): Promise<CommonFetchResponse<T>> {
        // 请求拦截器
        if (options.requestInterceptor) {
            options = options.requestInterceptor(options);
        }
        // 拼接请求地址
        const requsetUrl = `${options.baseUrl ? options.baseUrl : commonFetch.baseUrl}${url}`;
        // 发起请求
        const response = await fetch(requsetUrl, {
            credentials: commonFetch.withCredentials ? "include" : "same-origin",
            // timeout: commonFetch.timeout,
            ...options,
        })
        // 响应拦截器
        if (options.responseInterceptor) {
            return options.responseInterceptor(response);
        }
        return response as CommonFetchResponse<T>;
    }

}