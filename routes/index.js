const KoaRouter = require('koa-router'),
    dao = require('../dao/file_record')

router = new KoaRouter({
    prefix: '/node'
});
router.get('/record/:hash', async ctx => {
    let doc = {
        hash : ctx.originalUrl.replace(/^\/node\/record\//,"").replace(/&cb=.*?$/,"").replace(/&callback=.*?$/,""),
    }
    await dao.create(doc)
    console.log('add' +　new Date())
    ctx.body = { code: 200, msg: 'OK' };
})
router.get('/record', async ctx => {
    let params = ctx.query;
    let cb = params.cb;
    delete params.cb;
    console.log('read - ' +　new Date())
    ctx.body = `${cb}(${JSON.stringify(await dao.list(params))})`;
})

module.exports = router;