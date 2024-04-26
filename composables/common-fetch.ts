import pTimeout from 'p-timeout';


/**
 * 自定义请求配置
 */
export interface FetchRequestInit extends RequestInit {
  // 请求域名
  baseUrl?: string;
  // 请求拦截器
  requestInterceptor?: (requestConfig: FetchRequestInit) => FetchRequestInit;
  // 响应拦截器
  responseInterceptor?: <T = any>(response: FetchResponse<T>) => FetchResponse<T>;
}

// fetch请求配置的属性
const fetchOptionsKeys = [
  'method', 'body', 'headers', 'cache', 'credentials',
  'keepalive', 'mode', 'redirect', 'referrer', 'integrity',
  'signal', 'window', 'baseUrl', 'requestInterceptor',
  'responseInterceptor'
];

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
}

/**
 * @desc 封装一个基于fetch的通用请求方法
 */
export class commonFetch {
  /**'
   * 域名
   */
  static baseUrl: string = "";

  /**
   * 是否携带cookie
   */
  static credentials?: "omit" | "same-origin" | "include" = "omit";

  /**
   * 默认超时时间
   */
  static timeout: number = 60000;

  /**
   * 对象控制器 用于终止一个或多个web请求
   */
  private static abortController: AbortController = new AbortController();

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
   * @returns {baseUrl:string; options:FetchRequestInit}
   */
  private static cleanOptions(options: FetchRequestInit):{
    baseUrl:string
    options:FetchRequestInit
  } {
    const signal = this.abortController.signal;
    options.signal = signal
    options.credentials = options.credentials || commonFetch.credentials
    const baseUrl = options.baseUrl || commonFetch.baseUrl;
    delete options.requestInterceptor;
    delete options.responseInterceptor;
    delete options.baseUrl;
    return {
      baseUrl,
      options,
    }
  }

  /**
   * @desc 通用请求
   * @param url {string}
   * @param options {FetchRequestInit}
   * @returns {Promise<FetchResponse<T>>}
   */
  private static request<T = any>(url: string, options: FetchRequestInit): Promise<FetchResponse<T>> {
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
    const responseP = fetch(requsetUrl, {
      ...realOptions,
    }).then((response: FetchResponse<T>) => {
      if (responseInterceptor) {
        // 响应配置的拦截器
        return responseInterceptor(response);
      } else {
        // 统一响应拦截器
        return (response)
      }
    })


    if (this.timeout) {
      return pTimeout(responseP, {
        milliseconds: this.timeout,
        signal: this.abortController.signal,
        message: `${requsetUrl} timed out waiting for response`,
      });
    } else {
      return responseP as Promise<FetchResponse<T>>;
    }
  }
}



