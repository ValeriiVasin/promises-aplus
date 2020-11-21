import { MyPromise } from './promise';

const log = (msg: string) => (v: any) => console.log(msg, v);

const sentinel = { sentinel: 'sentinel' };

function thenable(value: any) {
  return {
    then: function (onFulfilled: (value: any) => any) {
      onFulfilled(value);
      throw 421;
    },
  };
}

const x = {
  then(resolve: any, reject: any) {
    resolve(thenable(sentinel));
  },
};

//Promise.resolve(x).then(log('should'));
MyPromise.resolve(x).then(log('is'), log('thrown'));
