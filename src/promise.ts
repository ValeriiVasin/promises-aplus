type TOptFunc = null | undefined | ((v: any) => any);
type RejectFn = (message?: string | TypeError) => any;
type ResolveFn = (value?: any) => any;
type PromiseCallback = (resolve: ResolveFn, reject: RejectFn) => void;

enum PromiseState {
  Pending,
  Fulfilled,
  Rejected,
}

function once(fn: (...args: any[]) => any): (...args: any[]) => any {
  let result: any;
  let wasCalled = false;

  return (...args: any) => {
    if (wasCalled) {
      return result;
    }
    wasCalled = true;
    result = fn(...args);
  };
}

export class MyPromise {
  #value: any;
  #isPending = true;
  #state: PromiseState = PromiseState.Pending;

  #resolvers: ResolveFn[] = [];
  #catchers: RejectFn[] = [];

  static resolve(value?: any) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason?: any) {
    return new MyPromise((_, reject) => reject(reason));
  }

  constructor(callback: PromiseCallback) {
    const __resolve = (value: any) => {
      this.#state = PromiseState.Fulfilled;
      this.#value = value;
      this.drain();
    };

    const __reject = (reason: any) => {
      this.#state = PromiseState.Rejected;
      this.#value = reason;
      this.drain();
    };

    const resolve: ResolveFn = once((value) => {
      if (!this.#isPending) {
        return;
      }

      this.#isPending = false;
      resolveValue(value, {
        resolve: __resolve,
        reject: __reject,
        getPromise: () => this,
      });
    });

    const reject: RejectFn = once((reason: any) => {
      if (!this.#isPending) {
        return;
      }

      this.#isPending = false;
      __reject(reason);
    });

    callback(resolve, reject);
  }

  then(onFulfilled?: TOptFunc, onRejected?: TOptFunc): MyPromise {
    const promise = new MyPromise((resolve, reject) => {
      const getPromise = () => promise;

      const resolver = (value: any) => {
        try {
          resolve(
            typeof onFulfilled === 'function' ? onFulfilled(value) : value
          );
        } catch (e) {
          reject(e);
        }
      };

      const rejector = (reason: any) => {
        if (typeof onRejected !== 'function') {
          reject(reason);
          return;
        }

        try {
          resolveValue(onRejected(reason), { resolve, reject, getPromise });
        } catch (e) {
          reject(e);
        }
      };

      this.#resolvers.push(resolver);
      this.#catchers.push(rejector);
      this.drain();
    });

    return promise;
  }

  private drain() {
    setImmediate(() => this._drain());
  }

  private _drain() {
    if (this.#state === PromiseState.Pending) {
      return;
    }

    if (this.#state === PromiseState.Fulfilled) {
      this.#catchers = [];
      while (this.#resolvers.length) {
        this.#resolvers.shift()?.(this.#value);
      }
      return;
    }

    this.#resolvers = [];
    while (this.#catchers.length) {
      this.#catchers.shift()?.(this.#value);
    }
  }
}

// https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
function resolveValue(
  value: any,
  {
    resolve,
    reject,
    getPromise,
  }: { resolve: ResolveFn; reject: RejectFn; getPromise: () => MyPromise }
) {
  try {
    const onResolve = (value: any) =>
      resolveValue(value, { resolve, reject, getPromise });

    const wrapped = wrapResolveReject({ resolve: onResolve, reject });

    const promise = getPromise();
    if (value === promise) {
      reject(new TypeError('Promise should not return itself'));
      return;
    }

    if (value instanceof MyPromise) {
      value.then(resolve, reject);
      return;
    }

    if ((value && typeof value === 'object') || typeof value === 'function') {
      let then = value.then;

      if (typeof then === 'function') {
        try {
          then.call(value, wrapped.resolve, wrapped.reject);
        } catch (e) {
          wrapped.reject(e);
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

// inside of value resolution function for thenable
// we should:
// - global control that only reject or resolved called
// - it is called only once
// - if it throws inside of `.then()` call, but was resolved before - ignore
function wrapResolveReject({
  resolve,
  reject,
}: {
  resolve: ResolveFn;
  reject: RejectFn;
}): { resolve: ResolveFn; reject: RejectFn } {
  let isDone = false;

  const wrappedResolve = once((...args: any[]) => {
    if (isDone) {
      return;
    }

    isDone = true;
    resolve(...args);
  });

  const wrappedReject = once((...args: any[]) => {
    if (isDone) {
      return;
    }

    isDone = true;
    reject(...args);
  });

  return {
    resolve: wrappedResolve,
    reject: wrappedReject,
  };
}
