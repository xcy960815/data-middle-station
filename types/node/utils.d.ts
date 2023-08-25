declare global {
  namespace UtilsModule {
    interface ProcessEnvProperties extends NodeJS.ProcessEnv {}

    type GetProcessEnvPropertiesReturnType<T extends keyof UtilsModule.ProcessEnvProperties> =
      UtilsModule.ProcessEnvProperties[T] extends UtilsModule.ProcessEnvProperties
        ? UtilsModule.ProcessEnvProperties
        : UtilsModule.ProcessEnvProperties[T];
  }
}

export {};
