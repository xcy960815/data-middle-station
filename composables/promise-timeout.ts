

interface ClearablePromise<T> extends Promise<T> {
    clear: () => void;
};

export type ClearablePromiseOptions = {
    milliseconds: number;
    message?: string | Error | false;
    readonly customTimers?: {
        setTimeout: typeof globalThis.setTimeout;
        clearTimeout: typeof globalThis.clearTimeout;
    };
    signal?: globalThis.AbortSignal;
};


export class TimeoutError extends Error {
    name: string
    constructor(message?: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class AbortError extends Error {
    name: string
    message: string;
    constructor(message: string) {
        super(message);
        this.name = 'AbortError';
        this.message = message;
    }
}


const getDOMException = (errorMessage: string): AbortError | DOMException => {
    return globalThis.DOMException === undefined
        ? new AbortError(errorMessage)
        : new DOMException(errorMessage);
}

const getAbortedReason = (signal: AbortSignal) => {
    const reason = signal.reason === undefined
        ? getDOMException('This operation was aborted')
        : signal.reason;

    return reason instanceof Error ? reason : getDOMException(reason);
};

export function promiseTimeout<V = any>(inputPromise: PromiseLike<V>, options: ClearablePromiseOptions) {
    const {
        milliseconds,
        message,
        customTimers = { setTimeout, clearTimeout },
    } = options;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const wrappedPromise = new Promise<V | void>((resolve, reject) => {
        const { signal } = options;
        if (signal) {
            if (signal.aborted) {
                reject(getAbortedReason(signal));
            }

            signal.addEventListener('abort', () => {
                reject(getAbortedReason(signal));
            });
        }
        
        if (milliseconds === Number.POSITIVE_INFINITY) {
			inputPromise.then(resolve, reject);
			return;
		}

        timer = customTimers.setTimeout.call(undefined, () => {
            if (message === false) {
                resolve();
            } else if (message instanceof Error) {
                reject(message);
            } else {
                const timeoutError = new TimeoutError();
                timeoutError.message = message ?? `Promise timed out after ${milliseconds} milliseconds`;
                reject(timeoutError);
            }
        }, milliseconds);

        (async () => {
            try {
                const inputPromiseResult = await inputPromise
                resolve(inputPromiseResult);
            } catch (error) {
                reject(error);
            }
        })();
    });


    const cancelablePromise = wrappedPromise.finally(() => {
        cancelablePromise.clear();
    }) as ClearablePromise<V>;

    cancelablePromise.clear = () => {
        customTimers.clearTimeout.call(undefined, timer);
        timer = undefined;
    };

    return cancelablePromise;
}



