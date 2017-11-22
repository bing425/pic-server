const mongo = require('./mongo'),
ObjectId = require('mongodb').ObjectID;

module.exports = {
   list: (params) => {
       return new Promise(
           (resolve, reject) => {
               mongo.findDocuments('file_record', params, (results) => {
                   resolve(results);
               });
           });
   },
   query: (params) => {
       return new Promise(
           (resolve, reject) => {
               mongo.findAllDocuments('file_record',params, (docs)=>{
                   resolve(docs);
               });
           }
       );
   },
   get: (param) => {
       return new Promise(
           (resolve, reject) => {
               mongo.findDocument('file_record', param, (doc) => {
                   resolve(doc);
               });
           });
   },
   create: (doc) => {
       return new Promise(
           (resolve, reject) => {
               mongo.insertDocument('file_record', doc, (err, result) => {
                   if (err) reject("系统异常，新增失败!");
                   resolve(null);
               });
           });
   },
   update: (doc) => {
       return new Promise(
           (resolve, reject) => {
               mongo.updateDocument('file_record', { _id: new ObjectId(doc._id) }, doc, (err, result) => {
                   if (err != null || result.result.n == 0) {
                       reject("系统异常,更新失败!");
                   } else {
                       resolve(null);
                   }
               });
           });
   },
   delete: (id) => {
       return new Promise(
           (resolve, reject) => {
               mongo.removeDocument('file_record', { _id: new ObjectId(id) }, (err, res) => {
                   if (err) reject("系统异常,删除失败!");
                   resolve(null);
               });
           });
   }
}