import Debug from "debug";
import { EventHooks } from "./lib/eventhooks.js";

const debug = Debug("crudlify");


// module variables
let Datastore = null;
let _schema = {};
let _opt = {};
let _validate = null;
let _cast = null;
let _prepare = null;
let _query = null;
let _eventHooks = null;


/**
 * 
 * @param {object} app - Codehooks app ( npm package codehooks-js)
 * @param {object} schema - Yup schema object
 * @param {object} options - Options
 * @returns {EventHooks} Hooks for REST operations
 */
export default async function crudlify(app, schema = {}, options = { schema: "yup", query: "q2m" }) {
    _schema = schema;
    _opt = options;
    try {
        // the DB variable is present when running as a codehooks.io app
        Datastore = DB;
    } catch (error) {
        debug("Standalone mode:", error.message)
    }
    try {
        app.addListener((updatedApp) => {
            Datastore = updatedApp.getDatastore();
            debug('Updated app', Datastore)
        })
    } catch (error) {
        debug(error)
    }
    // load query language
    _query = await import(`./lib/query/${options.query || 'q2m'}/index.js`);
    debug('Query lang', _query)

    // dynamic schema import
    _validate = (await import(`./lib/schema/${options.schema || 'yup'}/index.js`)).validate;
    _cast = (await import(`./lib/schema/${options.schema || 'yup'}/index.js`)).cast;
    _prepare = (await import(`./lib/schema/${options.schema || 'yup'}/index.js`)).prepare;
    _schema = _prepare(_schema);

    // App API routes
    app.post('/:collection', createFunc);
    app.get('/:collection', readManyFunc);
    app.get('/:collection/:ID', readOneFunc);
    app.put('/:collection/:ID', updateFunc);
    app.patch('/:collection/_byquery', patchManyFunc);
    app.patch('/:collection/:ID', patchFunc);
    app.delete('/:collection/_byquery', deleteManyFunc);
    app.delete('/:collection/:ID', deleteFunc);
    _eventHooks = new EventHooks();
    return _eventHooks;
}


// override ther Datastore class
const setDatastore = function(ds) {
    Datastore = ds;
}

async function createFunc(req, res) {
    const { collection } = req.params;
    let document = req.body;
    const conn = await Datastore.open();
    if (_schema[collection] !== undefined) {
        
        if (_schema[collection] !== null) {
            _validate(_schema[collection], document)
                .then(async function (value) {
                    document = _cast(_schema[collection], value)
                    debug('cast', document)
                    _eventHooks.fireBefore(collection, 'POST', document);
                    const result = await conn.insertOne(collection, document);
                    _eventHooks.fireAfter(collection, 'POST', result);
                    res.json(result);
                })
                .catch(function (err) {
                    console.error(err, document)
                    res.status(400).json(err.message);
                });
        } else {
            // insert with collection name but no schema            
            const result = await conn.insertOne(collection, document);
            res.json(result);
        }
    } else {
        if (Object.keys(_schema).length === 0) {
            debug("data", collection, document)
            // insert any collection name no schema definitions, anything goes
            const result = await conn.insertOne(collection, document);
            res.json(result);
        } else {
            return res.status(400).json({ "error": `Collection not found: ${collection}` });
        }
        
    }
}


async function readManyFunc(req, res) {
    
    const { collection } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }

    const mongoQuery = _query.getMongoQuery(req.query, req.headers);    
    
    const conn = await Datastore.open();
    
    return (await conn.getMany(collection, mongoQuery)).json(res);
}

async function readOneFunc(req, res) {
    console.log("crudlify read one")
    const { collection, ID } = req.params;
    const conn = await Datastore.open();
    try {
        if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
            return res.status(404).send(`No collection ${collection}`)
        }
        const result = await conn.getOne(collection, ID);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e.message);
    }
}

async function updateFunc(req, res) {
    const { collection, ID } = req.params;
    
    try {
        if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
            return res.status(404).send(`No collection ${collection}`)
        }
        const document = req.body;
        const conn = await Datastore.open();
        _eventHooks.fireBefore(collection, 'PUT', document);
        const result = await conn.replaceOne(collection, ID, document, {});
        _eventHooks.fireAfter(collection, 'PUT', result);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e);
    }
}

async function patchFunc(req, res) {
    const { collection, ID } = req.params;
    try {
        if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
            return res.status(404).send(`No collection ${collection}`)
        }
        const document = req.body;
        const conn = await Datastore.open();
        _eventHooks.fireBefore(collection, 'PATCH', document);
        const result = await conn.updateOne(collection, ID, document, {});
        _eventHooks.fireAfter(collection, 'PATCH', document);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e);
    }
}

async function patchManyFunc(req, res) {
    const { collection } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }
    
    try {
        const mongoQuery = _query.getMongoQuery(req.query, req.headers);    
        const document = req.body;
        const conn = await Datastore.open();
        _eventHooks.fireBefore(collection, 'PATCH', document);
        const result = await conn.updateMany(collection, document, mongoQuery);
        _eventHooks.fireAfter(collection, 'PATCH', result);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e);
    }
}

async function deleteFunc(req, res) {
    const { collection, ID } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }
    try {
        const conn = await Datastore.open();
        _eventHooks.fireBefore(collection, 'DELETE', document);
        const result = await conn.removeOne(collection, ID, {});
        _eventHooks.fireAfter(collection, 'DELETE', result);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e);
    }
}

async function deleteManyFunc(req, res) {
    const { collection } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }
    
    try {        
        const mongoQuery = _query.getMongoQuery(req.query, req.headers);
        const conn = await Datastore.open();
        const result = await conn.removeMany(collection, mongoQuery);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e);
    }
}

export {crudlify as crudlify, setDatastore}