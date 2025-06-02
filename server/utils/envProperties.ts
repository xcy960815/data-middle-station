/**
 * @desc 设置process.env的属性
 * @param { keyof NodeJS.ProcessEnv } propertieKey - 环境变量键名
 * @param { NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv] } propertieValue - 环境变量值
 * @returns {void}
 */
export const setProcessEnvProperties = (
  propertieKey: keyof NodeJS.ProcessEnv,
  propertieValue: NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv]
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
export const getProcessEnvProperties = (
  propertieKey: keyof NodeJS.ProcessEnv
): NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv] => {
  const env = process.env
  return env[propertieKey]
}
