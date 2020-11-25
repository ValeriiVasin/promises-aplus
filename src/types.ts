export type RejectFn = (reason?: any) => any;
export type ResolveFn = (value?: any) => any;
export type PromiseCallback = (resolve: ResolveFn, reject: RejectFn) => any;
export enum PromiseState {
  Pending,
  Fulfilled,
  Rejected,
}
