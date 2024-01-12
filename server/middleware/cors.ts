/**
 * @desc 跨域中间件
 * @link https://github.com/nuxt/nuxt/issues/14598
 * @param {import('h3').Event} event
 * @returns {void}
 */
export default defineEventHandler((event) => {
  const requestProtocol = getRequestProtocol(event);
  const requestHost = getRequestHost(event);
  // setResponseHeaders(event, {
  //   'Access-Control-Allow-Origin': `${requestProtocol}//${requestHost}`,
  //   'Access-Control-Allow-Credentials': 'true',
  //   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  //   'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  //   'Access-Control-Max-Age': '86400',
  // });
  // const headers = {
  //   'Access-Control-Allow-Origin': `${requestProtocol}//${requestHost}`,
  //   'Access-Control-Allow-Credentials': 'true',
  //   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  //   'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  //   'Access-Control-Max-Age': '86400',
  //   'connection': 'close',   // 添加缺失的属性
  //   'WWW-Authenticate': 'Basic realm="Login Required"',  // 添加缺失的属性
  //   'Authorization': 'Bearer xxxxx',  // 添加缺失的属性
  //   'Proxy-Authenticate': 'Basic'  // 添加缺失的属性
  // };
  // setResponseHeaders(event, headers);

  // export default defineEventHandler((event) => {
  //   setResponseHeaders(event, {
  //     "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  //     "Access-Control-Allow-Origin": "*",
  //     'Access-Control-Allow-Credentials': 'true',
  //     "Access-Control-Allow-Headers": '*',
  //     "Access-Control-Expose-Headers": '*'
  //   })
  //   if(getMethod(event) === 'OPTIONS'){
  //     event.res.statusCode = 204
  //     event.res.statusMessage = "No Content."
  //     return 'OK'
  //   }
  // })

  // if(getMethod(event) === 'OPTIONS'){
  //   setResponseHeaders(event, {
  //     'Content-Length': '0',
  //   });
  //   event.res.statusCode = 204
  //   event.res.statusMessage = "No Content."
  //   return 'OK'
  // }
});
