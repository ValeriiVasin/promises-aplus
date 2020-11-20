import { MyPromise } from './promise';

const log = (msg: string) => (v: any) => console.log(msg, v);

// MyPromise.resolve(5).then(log('directly resolved'), log('FALSE'));
// MyPromise.reject(90).then(log('FALSE'), log('directly rejected'));

const p: any = MyPromise.resolve().then(() => p);

p.then(log('it should not be resolved'), log('should be rejected'));
