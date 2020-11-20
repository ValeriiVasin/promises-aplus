type TOptFunc = null | undefined | ((v: any) => void);
type RejectFn = (message?: string) => any;
type ResolveFn = (value?: any) => any;
type PromiseCallback = (resolve: ResolveFn, reject: RejectFn) => void;

enum PromiseState {
  Pending,
  Fulfilled,
  Rejected,
}

export class MyPromise {
  #value: any;
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
    const resolve: ResolveFn = (value) => {
      if (this.#state !== PromiseState.Pending) {
        return;
      }

      this.#state = PromiseState.Fulfilled;
      this.#value = value;
      this.drain();
    };

    const reject: RejectFn = (message) => {
      if (this.#state !== PromiseState.Pending) {
        return;
      }

      this.#state = PromiseState.Rejected;
      this.#value = message;
      this.drain();
    };

    callback(resolve, reject);
  }

  then(onFulfilled?: TOptFunc, onRejected?: TOptFunc): MyPromise {
    return new MyPromise((resolve, reject) => {
      this.#resolvers.push(this.safe(onFulfilled, resolve, reject));
      this.#catchers.push(
        this.safe(onRejected, resolve, reject, { rejection: true })
      );
      this.drain();
    });
  }

  catch(fn?: TOptFunc) {
    if (typeof fn !== 'function') {
      return this;
    }

    return new MyPromise((resolve, reject) => {
      this.#catchers.push(this.safe(fn, resolve, reject, { rejection: true }));
      this.drain();
    });
  }

  fulfill(fn?: TOptFunc) {
    if (typeof fn !== 'function') {
      return this;
    }

    return new MyPromise((resolve, reject) => {
      this.#resolvers.push(this.safe(fn, resolve, reject));
      this.drain();
    });
  }

  private safe(
    fn: TOptFunc,
    resolve: ResolveFn,
    reject: RejectFn,
    { rejection }: { rejection: boolean } = { rejection: false }
  ) {
    return (v: any) => {
      if (typeof fn !== 'function') {
        if (rejection) {
          reject(v);
          return;
        }

        resolve(v);
        return;
      }

      try {
        const result = fn(v);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
  }

  private drain() {
    setImmediate(() => this._drain());
  }

  private _drain() {
    if (this.#state === PromiseState.Pending) {
      return;
    }

    if (this.#state === PromiseState.Fulfilled) {
      while (this.#resolvers.length) {
        this.#resolvers.shift()?.(this.#value);
      }
      return;
    }

    while (this.#catchers.length) {
      this.#catchers.shift()?.(this.#value);
    }
  }
}
