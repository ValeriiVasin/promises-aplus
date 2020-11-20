const log = (msg: string) => (v: any) => console.log(msg, v);

const syncThenable = {
  then(resolve: any, reject: any) {
    resolve('sync');
  },
};

const asyncThenable = {
  then(resolve: any, reject: any) {
    setTimeout(() => resolve('async'), 100);
  },
};

Promise.resolve(100)
  .then(() => {
    return syncThenable;
  })
  .then(log('value >>'));
