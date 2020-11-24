// suppress node warnings regarding the unhandled rejections
// that are coming from the test
function noop() {}
process.on('unhandledRejection', noop);
process.on('rejectionHandled', noop);

import { MyPromise } from './promise';

export function resolved(value: any) {
  return MyPromise.resolve(value);
}

export function rejected(reason: any) {
  return MyPromise.reject(reason);
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
