type RejectFn = (reason?: any) => any;
type ResolveFn = (value?: any) => any;
type PromiseCallback = (resolve: ResolveFn, reject: RejectFn) => any;

enum PromiseState {
  Pending,
  Fulfilled,
  Rejected,
}

export class MyPromise {
  #result: any;
  #state: PromiseState = PromiseState.Pending;
  #resolvers: ResolveFn[] = [];
  #rejectors: RejectFn[] = [];

  static resolve(value?: any) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason?: any) {
    return new MyPromise((_, reject) => reject(reason));
  }

  constructor(callback: PromiseCallback) {
    const doResolve: ResolveFn = (value) => {
      this.#state = PromiseState.Fulfilled;
      this.#result = value;
      this.check();
    };

    const doReject: RejectFn = (reason) => {
      this.#state = PromiseState.Rejected;
      this.#result = reason;
      this.check();
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

  then(onFulfilled?: any, onRejected?: any): MyPromise {
    const promise = new MyPromise((resolve, reject) => {
      const resolver: ResolveFn =
        typeof onFulfilled === 'function'
          ? (value) => {
              try {
                resolve(onFulfilled(value));
              } catch (e) {
                reject(e);
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
              } catch (e) {
                reject(e);
              }
            }
          : reject;

      this.#resolvers.push(resolver);
      this.#rejectors.push(rejector);
      this.check();
    });

    return promise;
  }

  private check(options: { sync: boolean } = { sync: false }) {
    if (!options.sync) {
      setImmediate(() => this.check({ sync: true }));
      return;
    }

    if (this.#state === PromiseState.Pending) {
      return;
    }

    if (this.#state === PromiseState.Fulfilled) {
      this.#rejectors = [];
      while (this.#resolvers.length) {
        this.#resolvers.shift()?.(this.#result);
      }
      return;
    }

    this.#resolvers = [];
    while (this.#rejectors.length) {
      this.#rejectors.shift()?.(this.#result);
    }
  }
}

// https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
function resolvePromise({
  value,
  promise,
  resolve,
  reject,
}: {
  promise: MyPromise;
  value: any;
  resolve: ResolveFn;
  reject: RejectFn;
}) {
  if (value === promise) {
    reject(new TypeError('Promise should not return itself'));
    return;
  }

  try {
    if (value instanceof MyPromise) {
      value.then(resolve, reject);
      return;
    }

    if ((value && typeof value === 'object') || typeof value === 'function') {
      let then = value.then;

      if (typeof then === 'function') {
        const {
          resolve: wrappedResolve,
          reject: wrappedReject,
        } = wrapResolveReject({
          resolve: (value) =>
            resolvePromise({ promise, value, resolve, reject }),
          reject,
        });

        try {
          then.call(value, wrappedResolve, wrappedReject);
        } catch (e) {
          wrappedReject(e);
        }
        return;
      }

      resolve(value);
      return;
    }

    resolve(value);
  } catch (e) {
    reject(e);
  }
}

// when resolve/reject is called - it sets promise into
// "fulfilled" or "rejected" state. All the consequent calls
// are not influencing the result
function wrapResolveReject({
  resolve,
  reject,
}: {
  resolve: ResolveFn;
  reject: RejectFn;
}): { resolve: ResolveFn; reject: RejectFn } {
  let isDone = false;
  return {
    resolve: (value) => {
      if (isDone) {
        return;
      }

      isDone = true;
      resolve(value);
    },
    reject: (reason) => {
      if (isDone) {
        return;
      }

      isDone = true;
      reject(reason);
    },
  };
}
