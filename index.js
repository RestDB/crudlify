import { EventHooks } from "./lib/eventhooks.js";
import {getMongoQuery as _queryQ2M} from "./lib/query/q2m/index.js";
import {validate as _validateYup, cast as _castYup, prepare as _prepareYup} from "./lib/schema/yup/index.js";
import {validate as _validateJSON, cast as _castJSON, prepare as _prepareJSON} from "./lib/schema/json-schema/index.js";
import {validate as _validateZod, cast as _castZod, prepare as _prepareZod }  from "./lib/schema/zod/index.js";

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
    console.log('Init crudlify', schema, options)
    _schema = schema;
    _opt = options;
    try {
        // the DB variable is present when running as a codehooks.io app
        Datastore = DB;
    } catch (error) {
        if (error instanceof ReferenceError) {
            console.debug("Standalone mode:", error.message)
        }
    }
    try {
        app.addListener((updatedApp) => {
            Datastore = updatedApp.getDatastore();
            console.debug('Updated app Datastore', Datastore)
        })
    } catch (error) {
        console.debug(error)
    }
    // load query language
    _query = _queryQ2M;

    console.debug('Query lang', _query)

    // load schema validators
    console.debug('load validators')
    _validate = _validateYup;
    _cast = _castYup;
    _prepare = _prepareYup;
    
    // schema provider other than Yup?
    for (const property in schema) {
        console.log(`${property}: ${schema[property].toString()}`);
        if (schema[property].parse) {
            _opt.schema = 'zod';
        } else if (schema[property].properties) {
            _opt.schema = 'json-schema';
        }
    }
    
    if (new String(_opt.schema).toLowerCase() === 'json-schema') {
        _validate = _validateJSON;
        _cast = _castJSON;
        _prepare = _prepareJSON;
    }
    if (new String(_opt.schema).toLowerCase() === 'zod') {
        _validate = _validateZod;
        _cast = _castZod;
        _prepare = _prepareZod;
    }
    
    // prep schemas
    _schema = _prepare(_schema, _opt);

    console.debug('Apply routes to app');
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
    console.debug('Return event hooks');
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
            _validate(_schema[collection], document, _opt)
                .then(async function (value) {
                    document = _cast(_schema[collection], value)
                    console.debug('cast', document)
                    await _eventHooks.fireBefore(collection, 'POST', document);
                    const result = await conn.insertOne(collection, document);
                    await _eventHooks.fireAfter(collection, 'POST', result);
                    res.status(201).json(result);
                })
                .catch(function (err) {
                    console.error(err, document)
                    res.status(400).json(err.message || err);
                });
        } else {
            // insert with collection name but no schema  
            try {
                await _eventHooks.fireBefore(collection, 'POST', document);          
                const result = await conn.insertOne(collection, document);
                await _eventHooks.fireAfter(collection, 'POST', result);
                res.status(201).json(result);
            } catch (ex) {
                console.error(ex);
                res.status(400).send(ex);
            }
        }
    } else {
        if (Object.keys(_schema).length === 0) {
            console.debug("data", collection, document)
            // insert any collection name no schema definitions, anything goes
            try {
                await _eventHooks.fireBefore(collection, 'POST', document);          
                const result = await conn.insertOne(collection, document);
                await _eventHooks.fireAfter(collection, 'POST', result);
                res.status(201).json(result);
            } catch (ex) {
                console.error(ex);
                res.status(400).send(ex);
            }
        } else {
            return res.status(400).json({ "error": `Collection not found: ${collection}` });
        }
        
    }
}


async function readManyFunc(req, res) {
    try {
        const { collection } = req.params;
        if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
            return res.status(404).send(`No collection ${collection}`)
        }

        const mongoQuery = _query(req.query, req.headers);    
        console.debug('Mongo query', mongoQuery)
    
    
        const conn = await Datastore.open();
        
        return (await conn.getMany(collection, mongoQuery)).json(res);
    } catch (ex) {
        console.error(ex.message);
        res.status(400).send(ex.message);
    }
}

async function readOneFunc(req, res) {
    console.debug("crudlify read one")
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
        delete document._id; // avoid schema validation error
        _validate(_schema[collection], document, _opt)
            .then(async function (value) {
                document._id = ID; // put back id that was removed for validation
                const conn = await Datastore.open();
                await _eventHooks.fireBefore(collection, 'PUT', document);
                const result = await conn.replaceOne(collection, ID, document, {});
                await _eventHooks.fireAfter(collection, 'PUT', result);
                res.json(result);
            })
            .catch(function (err) {
                console.error(err, document)
                res.status(400).json(err.message || err);
            });
    } catch (e) {
        res
            .status(404) // not found
            .end(e.message);
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
        await _eventHooks.fireBefore(collection, 'PATCH', document);
        const result = await conn.updateOne(collection, ID, document, {});
        await _eventHooks.fireAfter(collection, 'PATCH', document);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e.message);
    }
}

async function patchManyFunc(req, res) {
    const { collection } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }
    
    try {
        const mongoQuery = _query(req.query, req.headers);    
        const document = req.body;
        const conn = await Datastore.open();
        await _eventHooks.fireBefore(collection, 'PATCH', document);
        const result = await conn.updateMany(collection, document, mongoQuery);
        await _eventHooks.fireAfter(collection, 'PATCH', result);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e.message);
    }
}

async function deleteFunc(req, res) {
    const { collection, ID } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }
    try {
        const conn = await Datastore.open();
        await _eventHooks.fireBefore(collection, 'DELETE', ID);
        const result = await conn.removeOne(collection, ID, {});
        await _eventHooks.fireAfter(collection, 'DELETE', result);
        console.debug('Delete result', result)
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e.message);
    }
}

async function deleteManyFunc(req, res) {
    const { collection } = req.params;
    if (Object.keys(_schema).length > 0 && _schema[collection] === undefined) {
        return res.status(404).send(`No collection ${collection}`)
    }
    
    try {        
        const mongoQuery = _query(req.query, req.headers);
        const conn = await Datastore.open();
        const result = await conn.removeMany(collection, mongoQuery);
        res.json(result);
    } catch (e) {
        res
            .status(404) // not found
            .end(e.message);
    }
}

export {crudlify as crudlify, setDatastore}