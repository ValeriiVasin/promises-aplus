import { resolvePromise } from './helpers/resolve-promise';
import { wrapResolveReject } from './helpers/wrap-resolve-reject';
import { PromiseCallback, PromiseState, RejectFn, ResolveFn } from './types';

export class Promise {
  #result: any;
  #state: PromiseState = PromiseState.Pending;
  #queue: Array<{ resolve: ResolveFn; reject: RejectFn }> = [];

  static resolve(value?: any) {
    return new Promise((resolve) => resolve(value));
  }

  static reject(reason?: any) {
    return new Promise((_, reject) => reject(reason));
  }

  constructor(callback: PromiseCallback) {
    const doResolve: ResolveFn = (value) => {
      this.#state = PromiseState.Fulfilled;
      this.#result = value;
      this.processQueue();
    };

    const doReject: RejectFn = (reason) => {
      this.#state = PromiseState.Rejected;
      this.#result = reason;
      this.processQueue();
    };

    const { resolve, reject } = wrapResolveReject({
      resolve: (value) => {
        resolvePromise({
          promise: this,
          value,
          resolve: doResolve,
          reject: doReject,
        });
      },
      reject: doReject,
    });

    callback(resolve, reject);
  }

  then(onFulfilled?: any, onRejected?: any): Promise {
    const promise = new Promise((resolve, reject) => {
      const resolver: ResolveFn =
        typeof onFulfilled === 'function'
          ? (value) => {
              try {
                resolve(onFulfilled(value));
              } catch (error) {
                reject(error);
              }
            }
          : resolve;

      const rejector: RejectFn =
        typeof onRejected === 'function'
          ? (reason) => {
              try {
                resolvePromise({
                  promise,
                  value: onRejected(reason),
                  resolve,
                  reject,
                });
              } catch (error) {
                reject(error);
              }
            }
          : reject;

      this.#queue.push({ resolve: resolver, reject: rejector });
      this.processQueue();
    });

    return promise;
  }

  private processQueue(options: { sync: boolean } = { sync: false }) {
    if (!options.sync) {
      setTimeout(() => this.processQueue({ sync: true }), 0);
      return;
    }

    if (this.#state === PromiseState.Pending) {
      return;
    }

    while (this.#queue.length > 0) {
      const { resolve, reject } = this.#queue.shift()!;

      if (this.#state === PromiseState.Fulfilled) {
        resolve(this.#result);
        continue;
      }

      reject(this.#result);
    }
  }
}
