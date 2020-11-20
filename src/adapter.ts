// suppress node warnings regarding the unhandled rejections
// that are coming from the test
function noop() {}
process.on('unhandledRejection', noop);
process.on('rejectionHandled', noop);

import { MyPromise } from './promise';
const Promise = MyPromise;

export function resolved(value: any) {
  return Promise.resolve(value);
}

export function rejected(reason: string) {
  return Promise.reject(reason);
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}
