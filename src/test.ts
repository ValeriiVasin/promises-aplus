import { MyPromise } from './promise';

const log = (msg: string) => (v: any) => console.log(msg, v);

const sentinel = { sentinel: 'sentinel' };

function createOneTimeThenable(value: any) {
  var numberOfTimesThenRetrieved = 0;
  return Object.create(null, {
    then: {
      get: function () {
        if (numberOfTimesThenRetrieved === 0) {
          ++numberOfTimesThenRetrieved;
          return function (onFulfilled: any) {
            onFulfilled(value);
          };
        }
        return null;
      },
    },
  });
}

const syncThenable = createOneTimeThenable(sentinel);

const x = {
  then(resolve: any, reject: any) {
    resolve(syncThenable);
  },
};

MyPromise.resolve(x).then(log('>>'));

Promise.reject(5)
  .then(null, () => {
    return 10;
  })
  .then(log('resolve'), log('reject'));
