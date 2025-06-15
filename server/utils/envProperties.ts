/**
 * @desc 设置process.env的属性
 * @param { keyof NodeJS.ProcessEnv } propertieKey - 环境变量键名
 * @param { NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv] } propertieValue - 环境变量值
 * @returns {void}
 */
export const setProcessEnvProperties = <T extends keyof NodeJS.ProcessEnv>(
  propertieKey: T,
  propertieValue: NodeJS.ProcessEnv[T]
): void => {
  const env: NodeJS.ProcessEnv = process.env || {}
  env[propertieKey] = propertieValue
  process.env = env
}

/**
 * @desc 获取process.env的属性
 * @param { keyof NodeJS.ProcessEnv } propertieKey - 环境变量键名
 * @returns { NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv] } 环境变量值
 */
export const getProcessEnvProperties = <T extends keyof NodeJS.ProcessEnv>(
  propertieKey: T
): NodeJS.ProcessEnv[T] => {
  const env = process.env
  return env[propertieKey]
}
