import pTimeout from 'p-timeout';
import type { ClearablePromise } from "p-timeout"



export interface FetchRequestInit extends RequestInit {
  // 请求域名
  baseUrl?: string;
  // 携带cookie
  credentials?: "omit" | "same-origin" | "include"
  // 请求拦截器
  requestInterceptor?: (requestConfig: FetchRequestInit) => FetchRequestInit;
  // 响应拦截器
  responseInterceptor?: <T = any>(response: FetchResponse<T>) => FetchResponse<T>;
}


/**
 * @desc 判断是否是Fetch请求配置
 * @param options {unknown}
 * @returns {options is FetchRequestInit}
 */
function isFetchRequestInit(options: unknown): options is FetchRequestInit {
  let isFetchRequestInit = false;
  if (typeof options !== 'object' || options === null) {
    return false;
  }
  // fetch请求配置的属性
  const fetchOptionsKeys = [
    'method', 'body', 'headers', 'cache', 'credentials',
    'keepalive', 'mode', 'redirect', 'referrer', 'integrity',
    'signal', 'window', 'baseUrl', 'requestInterceptor',
    'responseInterceptor'
  ];

  for (const key of fetchOptionsKeys) {
    if (!(key in options)) {
      continue;
    }

    const value = (options as Record<string, any>)[key];

    switch (key) {
      case 'method':
        isFetchRequestInit = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/i.test(value);
        break;

      case 'cache':
        isFetchRequestInit = /^(default|no-store|reload|no-cache|force-cache|only-if-cached)$/i.test(value);
        break;

      case 'mode':
        isFetchRequestInit = /^(same-origin|cors|no-cors|navigate)$/i.test(value);
        break;

      case 'redirect':
        isFetchRequestInit = /^(follow|error|manual)$/i.test(value);
        break;

      case 'credentials':
        isFetchRequestInit = /^(omit|same-origin|include)$/i.test(value);
        break;

      case 'signal':
        isFetchRequestInit = ('abort' in value)
        break;

      default:
        // 其他属性没有特殊处理
        isFetchRequestInit = false;
        break;
    }
  }

  return isFetchRequestInit;
}




// 支持定义返回的json数据类型
export interface FetchResponse<T = any> extends Response {
  json(): Promise<T>;
  clear: Function
}

/**
 * @desc 封装一个基于fetch的通用请求方法
 */
export class commonFetch {
  // 域名
  static baseUrl: string = "";

  // 携带cookie
  static credentials?: "omit" | "same-origin" | "include" = "omit";

  // 默认超时时间
  static timeout: number = 60000;

  static abortController: AbortController = new AbortController();

  // 函数重载
  static get<T = any>(url: string, params?: Record<string, string | number>): Promise<FetchResponse<T>>
  static get<T = any>(url: string, options?: FetchRequestInit): Promise<FetchResponse<T>>
  static get<T = any>(url: string, params?: Record<string, string | number>, options?: FetchRequestInit): Promise<FetchResponse<T>>
  /**
   * @desc get请求
   * @param url {string}
   * @param paramsOrOptions {Record<string, any> | FetchRequestInit}
   * @param options { FetchRequestInit } 
   * @returns {Promise<FetchResponse<T>>}
   */
  static get<T = any>(url: string, paramsOrOptions?: Record<string, string | number> | FetchRequestInit, options?: FetchRequestInit): Promise<FetchResponse<T>> {

    if (!isFetchRequestInit(paramsOrOptions)) {
      // 当paramsOrOptions为请求参数的时候 将里面的value变成字符串
      url = `${url} ? ${new URLSearchParams(paramsOrOptions as Record<string, string>).toString()}`;
    }


    return commonFetch.request<T>(url, {
      method: "GET",
      ...paramsOrOptions,
      ...options,
    });

  }

  // 函数重载
  static post<T = any>(url: string, data: Record<string, string | number>, options?: FetchRequestInit): Promise<FetchResponse<T>>
  static post<T = any>(url: string, options?: FetchRequestInit): Promise<FetchResponse<T>>
  static post<T = any>(url: string, dataOrOptions?: Record<string, string | number> | FetchRequestInit, options?: FetchRequestInit): Promise<FetchResponse<T>>
  /**
   * @desc post请求
   * @param url {string}
   * @param dataOrOptions {Record<string, string | number>}
   * @param options {FetchRequestInit} 
   * @returns {Promise<FetchResponse<T>>}
   */
  static post<T = any>(url: string, dataOrOptions?: Record<string, string | number> | FetchRequestInit, options?: FetchRequestInit): Promise<FetchResponse<T>> {
    if (!isFetchRequestInit(dataOrOptions)) {
      // 当dataOrOptions为请求参数的时候 将里面的value变成字符串
      return commonFetch.request<T>(url, {
        method: "POST",
        body: JSON.stringify(dataOrOptions),
        ...options,
      });
    } else {
      return commonFetch.request<T>(url, {
        method: "POST",
        ...dataOrOptions,
        ...options,
      });
    }
  }

  /**
   * @desc 格式化参数
   * @param {FetchRequestInit} options 
   * @returns 
   */
  static cleanOptions(options: FetchRequestInit) {
    const signal = this.abortController.signal;
    options.signal = signal
    options.credentials = options.credentials || commonFetch.credentials
    const requestInterceptor = options.requestInterceptor;
    const responseInterceptor = options.responseInterceptor;
    const baseUrl = options.baseUrl || this.baseUrl;
    delete options.requestInterceptor;
    delete options.responseInterceptor;
    delete options.baseUrl;
    return {
      baseUrl,
      options,
      requestInterceptor,
      responseInterceptor,
    }
  }

  /**
   * @desc 通用请求
   * @param url {string}
   * @param options {FetchRequestInit}
   * @returns {Promise<FetchResponse<T>>}
   */
  static async request<T = any>(url: string, options: FetchRequestInit): Promise<FetchResponse<T>> {
    const { requestInterceptor, responseInterceptor } = options

    if (requestInterceptor) {
      // 请求配置的拦截器
      options = requestInterceptor(options);
    } else {
      // 统一请求拦截器
    }
    const { baseUrl, options: realOptions } = this.cleanOptions(options)
    // 拼接请求地址
    const requsetUrl = `${baseUrl}${url}`;
    // 发起请求
    const responseP = new Promise<FetchResponse<T>>(async (resolve, reject) => {
      const result = await fetch(requsetUrl, {
        ...realOptions,
      })
      if (responseInterceptor) {
        // 响应配置的拦截器
        resolve(responseInterceptor(result as FetchResponse<T>));
      } else {
        // 统一响应拦截器
        resolve(result as FetchResponse<T>)
      }
    })


    if (this.timeout) {
      (responseP as ClearablePromise<FetchResponse<T>>).clear = () => {
        this.abortController?.abort();
      };
      return pTimeout(responseP, {
        milliseconds: this.timeout,
        message: `${requsetUrl} timed out waiting for response`,
      });
    } else {
      return responseP as Promise<FetchResponse<T>>;
    }


  }
}



