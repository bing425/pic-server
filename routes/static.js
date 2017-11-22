const router = require('koa-router')();
const fs = require('fs')
const path = require('path')
const pagePath = path.join(path.resolve(__dirname, '..'),'pages','dist')
const mime = require("mime")



let readFile = (dir) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(pagePath,dir),'utf8',(err, data) => {
            if(err){
                reject(err)
            }else{
                resolve(data)
            }
        })
    })
}

router.get('/*', async ctx => {
    let param = ctx.params[0]||'index.html'
    let file = await readFile(param)
    ctx.set('Content-Type',mime.getType(param)+';charset=utf-8');
    ctx.body = file
})


module.exports = router;