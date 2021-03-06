/**
  Create By me@qixin.io  2016-08-12 09:40:00

  MongoDB common operation utils:
  - Insert One Document.
  - Insert Many Documents.
  - Aggregate For $lookup
  - Find Document.
  - Find Specified Document.
  - Find All Documents with a Query Filter and Return results with page info.
  - Find All Documents with a Query Filter and without page query.
  - Find All Specified Documents with a Query Filter and without page query.
  - Find Specified Documents with a Query Filter and page query.
  - Find Doc count.
  - Update One Document.
  - Update Many Documents.
  - FindAndModify Documents.
  - Remove One Document.
  - Remove Many Document.
*/
const MongoClient = require('mongodb').MongoClient;
let db;

async function _init() {
    if (!db) {
        db = await new Promise(
            (resolve, reject) => {
                MongoClient.connect('mongodb://yannan:125131425@ds036079.mlab.com:36079/pic', (err, _db) => {
                    err != null ? reject(err) : resolve(_db);
                });
            }
        );
    }
}

(async () => {
    await _init();
})();

module.exports = {
    init: async () => {
        await _init();
    },
    /**
     * Get Mongo Database Instance.
     */
    getDB: () => {
        return db;
    },
    /** 
     * Insert one document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} doc Inserted document.
     * @param {Function} callback callback(err,result).
    */
    insertDocument: (collectionName, doc, callback) => {
        let collection = db.collection(collectionName);
        doc.createAt = new Date();
        collection.insertOne(doc, (err, result) => {
            callback(err, result);
        });
    },

    // ---------------------------------------------------------------------------
    /**
     * Insert many documents.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Array} docs Inserted documents.
     * @param {Function} callback callback(err,result).
     */
    insertDocuments: (collectionName, docs, callback) => {
        let collection = db.collection(collectionName);
        collection.insertMany(docs, (err, result) => {
            // console.log(result.result.n);   // result Contains the result document from MongoDB
            // console.log(result.ops.length); //ops Contains the documents inserted with added _id fields
            callback(err, result);
        });

    },

    insertDocumentNorepeatForPhone: (collectionName, doc, callback) => {
        let collection = db.collection(collectionName);
        collection.update({ Phone2: doc.Phone2, station: doc.station }, { $setOnInsert: doc }, { upsert: true }, (err, res) => {
            if (res.result.upserted == null) {
                // console.log('---> 重复数据不录入! ', doc);
                callback(doc.Phone2);
            } else {
                // console.log('---> 新录入数据:', doc);
                callback(null);
            }

        });
    },

    // ---------------------------------------------------------------------------
    // /**
    //  * Upsert document.
    //  * 
    //  * @param {String} collectionName Mongodb collection name.
    //  * @param {Object} queryDoc Query document.
    //  * @param {Object} upsertDoc Upserted document.
    //  * @param {Function} callback callback(err,result).
    //  */
    // upsertDocument: (collectionName, queryDoc, upsertDoc, callback) => {
    //     let collection = db.collection(collectionName);
    //     collection.update(queryDoc, upsertDoc, { upsert: true }, (err, result) => {
    //         callback(err, result);
    //     });
    // },

    // ---------------------------------------------------------------------------
    /**
     * Aggregate For $lookup
     * 
     * @param {String} collectionName - collection name
     * @param {Object} lookupDoc - { from: <collection to join>, localField: <field from the input documents>, foreignField: <field from the documents of the "from" collection>, as: <output array field>}
     * @param {Object} matchDoc - like having or where in SQL
     * @param {Object} pageDoc - page params.
     * @param {Function} callback - callback function return err,docs
     */
    aggregateForLookup: (collectionName, lookupDoc, matchDoc, pageDoc, callback) => {
        let page = pageDoc.page == null ? 1 : parseInt(pageDoc.page);
        let size = pageDoc.size == null ? 20 : parseInt(pageDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        let skip = (page - 1) * size;
        let collection = db.collection(collectionName);
        collection.aggregate([
            { $lookup: lookupDoc }, { $match: matchDoc == null ? {} : matchDoc }, { $skip: skip }, { $limit: size }
        ], (err, docs) => {
            collection.count(matchDoc, (err, count) => {
                callback(err, { docs: docs, count: count });
            });
        });
    },

    aggregate: (collectionName, queryArray, callback) => {
        let collection = db.collection(collectionName);
        collection.aggregate(queryArray, (err, docs) => {
            callback(docs);
        });
    },

    /**
     * Find One Document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(doc).
     */
    findDocument: (collectionName, queryDoc, callback) => {
        let collection = db.collection(collectionName);
        collection.findOne(queryDoc).then((doc) => {
            callback(doc);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Function} callback callback(doc).
     */
    findSpecifiedDocument: (collectionName, queryDoc, specifiedDoc, callback) => {
        let collection = db.collection(collectionName);
        collection.findOne(queryDoc, specifiedDoc).then((doc) => {
            callback(doc);
        });
    },

    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a Query Filter and Return results with page info.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(results).
     */
    findDocuments: (collectionName, queryDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        let page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        let size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        let skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        for (let pro in queryDoc) {
            if (!queryDoc[pro] && queryDoc[pro] !== 0) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        // desc by create time.
        collection.find(queryDoc)
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        let results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },

    findDocumentsWithSort: (collectionName, queryDoc, sortDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        let page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        let size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        let skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        for (let pro in queryDoc) {
            if (!queryDoc[pro] && queryDoc[pro] !== 0) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        // desc by create time.
        collection.find(queryDoc)
            .sort(sortDoc)
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        let results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },

    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a Query Filter and without page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(docs).
     */
    findAllDocuments: (collectionName, queryDoc, callback) => {
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        collection.find(queryDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a sorted document and a Query Filter and without page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(docs).
     */
    findAllDocumentsSorted: (collectionName, queryDoc, sortDoc, callback) => {
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        collection.find(queryDoc)
            .sort(sortDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Specified Documents with a Query Filter and without page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Function} callback callback(doc).
     */
    findAllSpecifiedDocuments: (collectionName, queryDoc, specifiedDoc, callback) => {
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Documents with a Query Filter and page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Function} callback callback(doc).
     */
    findSpecifiedDocuments: (collectionName, queryDoc, specifiedDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        let page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        let size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        let skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        let results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Sorted Documents with a Query Filter and page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(results).
     */
    findSpecifiedSortedDocuments: (collectionName, queryDoc, specifiedDoc, sortDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        let page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        let size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        let skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);

        collection.find(queryDoc, specifiedDoc)
            .sort(sortDoc)
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        let results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Specified Sorted Documents without page Filter query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(docs).
     */
    findAllSpecifiedSortedDocuments: (collectionName, queryDoc, specifiedDoc, sortDoc, callback) => {
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .sort(sortDoc)
            .toArray(
            (err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Doc count.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(results).
     */
    findCount: (collectionName, queryDoc, callback) => {
        for (let pro in queryDoc) {
            if (!queryDoc[pro]) // delete null property.
                delete queryDoc[pro];
        }
        let collection = db.collection(collectionName);
        collection.count(queryDoc, (err, count) => {
            callback(count);
        })
    },
    // ---------------------------------------------------------------------------
    /**
     * Update one document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} conditionDoc Update condition document.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(err,result).
     */
    updateDocument: (collectionName, conditionDoc, updatedDoc, callback) => {
        let collection = db.collection(collectionName);
        let update_doc = null;
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        if (updatedDoc.hasOwnProperty('$push') || updatedDoc.hasOwnProperty('$pull') || updatedDoc.hasOwnProperty('$unset')) {
            update_doc = updatedDoc;
        } else {
            updatedDoc.updateAt = new Date();
            update_doc = { $set: updatedDoc };
        }
        collection.updateOne(conditionDoc, update_doc, (err, result) => {
            callback(err, result);
        });
    },
    upsertDocument: (collectionName, conditionDoc, updatedDoc, callback) => {
        let collection = db.collection(collectionName);
        let update_doc = null;
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        if (updatedDoc.hasOwnProperty('$push') || updatedDoc.hasOwnProperty('$pull') || updatedDoc.hasOwnProperty('$unset')) {
            update_doc = updatedDoc;
        } else {
            updatedDoc.updateAt = new Date();
            update_doc = { $set: updatedDoc };
        }
        collection.update(conditionDoc, update_doc, { upsert: true, multi: false }, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Update many documents.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} conditionDoc Update condition document.
     * @param {Object} updatedDoc Updated document.
     * @param {Function} callback callback(err,result).
     */
    updateDocuments: (collectionName, conditionDoc, updatedDoc, callback) => {
        updatedDoc.updateAt = new Date();
        let collection = db.collection(collectionName);
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        collection.updateMany(conditionDoc, { $set: updatedDoc }, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * findAndModify requires a sort parameter. 
     * 
     * The {new: true} option will return the updated document when boolean true. 
     * If set to false, it will return the old document before update. 
     * 
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} sortDoc Sort document.
     * @param {Object} updateDoc Update document.
     * @param {Function} callback callback(err,result).
     */
    FindAndModifyDocument: (collectionName, queryDoc, sortDoc, updateDoc, callback) => {
        let collection = db.collection(collectionName);
        collection.findAndModify(queryDoc, sortDoc, updateDoc, { new: true }, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Remove one document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} doc Remove document.
     * @param {Function} callback callback(err,result).
     */
    removeDocument: (collectionName, doc, callback) => {
        let collection = db.collection(collectionName);
        collection.deleteOne(doc, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Remove Many documents.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} doc Remove document.
     * @param {Function} callback callback(err,result).
     */
    removeDocuments: (collectionName, doc, callback) => {
        let collection = db.collection(collectionName);
        collection.deleteMany(doc, (err, result) => {
            callback(err, result);
        });
    }
};
