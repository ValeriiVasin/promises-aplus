import type { RejectFn, ResolveFn } from '../types';

/**
 * when resolve/reject is called - it sets promise into
 * "fulfilled" or "rejected" state. All the consequent calls
 * are not influencing the result
 */
export function wrapResolveReject({
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
