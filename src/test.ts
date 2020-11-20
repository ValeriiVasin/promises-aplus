import { MyPromise } from './promise';

function noop() {}

const log = (msg: string) => (v: any) => console.log(msg, v);
const nonFunction = null;

const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(5);
  }, 1000);
});

MyPromise.resolve(5).then(log('directly resolved'), log('FALSE'));
MyPromise.reject(90).then(log('FALSE'), log('directly rejected'));

// MyPromise.reject({})
//   .then(undefined, function () {})
//   .then(log('done!!!'));

// MyPromise.reject({ dummy: 'dummy' })
//   .then(function () {}, undefined)
//   .then(nonFunction, log('done'));

p.then((v) => v * v)
  .then((v) => v * v)
  .then(console.log);

// p.then(() => {
//   throw 'hello';
// }).then(noop, (msg) => console.error(msg));

// p.then((v) => v * v)
//   .then((v) => v * v)
//   .then(console.log);
