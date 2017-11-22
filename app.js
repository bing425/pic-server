const Koa = require('koa');
const app = new Koa();
const path = require('path');
const fs = require('fs')
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  await next();
});

const routerDir = path.join(__dirname, 'routes');
let readFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(routerDir, (err, files) => {
      resolve(files.filter((f) => {
        return f.endsWith('.js') && f != 'base.js';
      }))
    });
  });
};

(async () => {
  let files = await readFiles();
  for (let file of files) {
    try {
      app.use(require(path.join(routerDir, file)).routes());
    } catch (error) {
      console.error('Start Failure !\n', error);
      process.exit(0);
    }
  }
})();

app.listen(3000, function () {
  console.log(`Server running on port 3000`);
});