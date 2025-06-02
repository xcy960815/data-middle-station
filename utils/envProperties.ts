/**
 * @desc 设置process.env的属性
 * @param { keyof NodeJS.ProcessEnv } propertieKey
 * @param { NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv]} propertieValue
 * @returns {void}
 */
export const setProcessEnvProperties = <
  T extends keyof NodeJS.ProcessEnv
>(
  propertieKey: T,
  propertieValue: NodeJS.ProcessEnv[T]
): void => {
  const env: NodeJS.ProcessEnv = process.env || {}
  env[propertieKey] = propertieValue
  process.env = env
}

/**
 * @desc 获取process.env的属性
 */
export const getProcessEnvProperties = <
  T extends keyof NodeJS.ProcessEnv
>(
  propertieKey: T | undefined
): T extends undefined
  ? NodeJS.ProcessEnv
  : NodeJS.ProcessEnv[T] => {
  const env = process.env
  if (propertieKey) {
    return env[propertieKey] as T extends undefined
      ? NodeJS.ProcessEnv
      : NodeJS.ProcessEnv[T]
  }
  return env as T extends undefined
    ? NodeJS.ProcessEnv
    : NodeJS.ProcessEnv[T]
}
