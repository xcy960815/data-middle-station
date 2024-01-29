/**
 * @desc webworker 实现类
 */
export class Webworker {
  private _actions: WebworkerModule.Action[] = [];
  /**
   * @desc 移除actions中的action
   * @param {string} messageName
   * @returns
   */
  private _removeAction(messageName: string): void {
    const index = this._actions.findIndex(({ message }) => message === messageName);
    if (index >= 0) this._actions.splice(index, 1);
  }

  /**
   * @desc 判断action是否已经存在
   * @param {WebworkerModule.Action} newAction
   * @returns {boolean}
   */
  private _inActions(newAction: WebworkerModule.Action) {
    return this._actions.some((action) => action.message === newAction.message);
  }
  /**
   * @desc 向actions中添加action
   * @param { WebworkerModule.Action } action
   * @returns {number}
   */
  private _addAction(action: WebworkerModule.Action): void {
    if (!this._inActions(action)) {
      this._actions.push(action);
    }
  }

  /**
   * @desc 创建webworker
   * @param {string} workerScript
   * @returns {Worker}
   */
  private _createDisposableWorker(workerScript: string): Worker {
    const URL = window.URL || window.webkitURL;
    const workerScriptBlob = new Blob([workerScript], { type: 'application/javascript' });
    const objectURL = URL.createObjectURL(workerScriptBlob);
    const worker = new Worker(objectURL);
    worker.post = () => {
      return new Promise((resolve, reject) => {
        worker.onmessage = (event) => {
          URL.revokeObjectURL(objectURL);
          resolve(event.data);
        };
        worker.onerror = (e: ErrorEvent) => {
          console.log('worker onerror', JSON.stringify(e));
          reject(e);
        };
        worker.postMessage({});
      });
    };

    return worker;
  }

  /**
   * @desc 创建webworker执行脚本
   * @param {() => T} callback
   * @returns {string}
   */
  createWorkerScript<T>(callback: () => T): string {
    // const args = event.data.message.args;
    // if (args) {
    //  self.postMessage((${callback}).apply(null, args));
    //  return close();
    // }
    return `self.onmessage = function(event) {
      self.postMessage((${callback})());
      return close();
    };
  `;
  }

  /**
   * @desc 执行webworker指令
   * @param {() => R} callback
   * @returns {Promise<R>}
   */
  public run<R>(callback: () => R): Promise<R> {
    const worker = this._createDisposableWorker(this.createWorkerScript<R>(callback));
    return worker.post<R>();
  }

  /**
   * @desc 执行webworker指令
   * @param {string} messageName
   * @returns {Promise<R> | void}
   */
  public postMessage<R>(messageName: string): Promise<R> {
    const lastCallback = this._actions
      .filter(({ message }) => message === messageName)
      .map((action) => action.callback)
      .pop();
    if (!lastCallback) {
      return new Promise((_, reject) => {
        reject(`"${messageName}" is not registered`);
      });
    }
    return this.run<R>(lastCallback);
  }
  /**
   * @desc 创建webworker任务
   * @param {WebworkerModule.Action[]} actions
   * @returns
   */
  constructor(actions?: WebworkerModule.Action[]) {
    this._actions = actions || [];
  }
  /**
   * @desc 执行所有webworker任务
   * @param { WebworkerModule.PostAllParams } postParams
   * @returns { Promise<T[]>}
   */
  public postMessageAll<T>(postParams?: WebworkerModule.PostAllParams): Promise<T[]> {
    if (
      Array.isArray(postParams) &&
      (postParams as string[]).every((item) => typeof item === 'string')
    ) {
      return Promise.all<T>(
        (postParams as string[]).map((message) => this.postMessage<T>(message)),
      );
    } else if (
      Array.isArray(postParams) &&
      (postParams as WebworkerModule.Action[]).every(
        (item) => typeof item === 'object' && !Array.isArray(item),
      )
    ) {
      return Promise.all<T>(
        (postParams as WebworkerModule.Action[]).map(({ message }: WebworkerModule.Action) =>
          this.postMessage<T>(message),
        ),
      );
    } else {
      const promises = this._actions.map(({ message }) => this.postMessage<T>(message));
      return Promise.all(promises).then((results) =>
        results.filter((result) => typeof result !== 'undefined'),
      );
    }
  }

  /**
   * @desc 注册webworker
   * @param {WebworkerModule.Action | WebworkerModule.Action[]} action
   * @returns {number}
   */
  public addAction(action: WebworkerModule.Action | WebworkerModule.Action[]): number {
    if (Array.isArray(action)) {
      action.forEach((action) => {
        this._addAction(action);
      });
    } else {
      this._addAction(action);
    }
    return this._actions.length;
  }

  /**
   * @desc 注销webworker
   * @param {Array<string> | string} messageNames
   * @returns {number}
   */
  public removeAction(messageNames: Array<string> | string): number {
    if (Array.isArray(messageNames)) {
      messageNames.forEach((messageName) => {
        this._removeAction(messageName);
      });
    } else {
      this._removeAction(messageNames);
    }
    return this._actions.length;
  }
}

/**
 * @desc 创建webworker
 * @param {import('@nuxt/types').NuxtAppOptions} nuxtApp
 * @returns {void}
 */
export default defineNuxtPlugin(() => {
  return {
    provide: {
      webworker: Webworker,
    },
  };
});
