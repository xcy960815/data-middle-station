import redisDriver from 'unstorage/drivers/redis';

/**
 * @desc 初始化Redis 驱动
 * @returns {void}
 */
export default defineNitroPlugin(() => {
  // const storage = useStorage();
  // // 判断是否已经挂载
  // if (storage.getMount('redis')) {
  //   return;
  // }
  // const driver = redisDriver({
  //   base: 'redis',
  //   host: useRuntimeConfig().redis.host,
  //   port: useRuntimeConfig().redis.port,
  //   username: useRuntimeConfig().redis.username,
  //   password: useRuntimeConfig().redis.password,
  // });
  // storage.mount('redis', driver);
});
