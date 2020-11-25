import { Promise } from '../promise';
import { RejectFn, ResolveFn } from '../types';
import { wrapResolveReject } from './wrap-resolve-reject';

/**
 * Promise resolution
 * https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
 *
 * We do need to pass resolve/reject privileged methods
 * because promise does not expose them publicly
 */
export function resolvePromise({
  promise,
  value,
  resolve,
  reject,
}: {
  promise: Promise;
  value: any;
  resolve: ResolveFn;
  reject: RejectFn;
}) {
  if (value === promise) {
    reject(new TypeError('Promise should not return itself'));
    return;
  }

  try {
    if (value instanceof Promise) {
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
        } catch (error) {
          wrappedReject(error);
        }
        return;
      }

      resolve(value);
      return;
    }

    resolve(value);
  } catch (error) {
    reject(error);
  }
}
