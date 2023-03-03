import Ajv from 'ajv';
const ajv = new Ajv({useDefaults: true});

import Debug from 'debug';
const debug = Debug("crudlify json-schema");

/**
 * 
 * @param {*} schema 
 * @param {*} document 
 * @returns 
 */
export const validate = (schema, document) => {
    debug('Validate', document, schema)
    return new Promise((resolve, reject) => {
        const valid = schema.validate(document);
        if (!valid) {
            reject(schema.validate.errors);
        } else {
            resolve(document);
        }
    })
}

export const cast = (schema, document) => {
    debug('Cast', document, schema)
    return document;
}

export const prepare = (schemas) => {
    debug('json-schema prep', schemas)
    for (const [key, value] of Object.entries(schemas)) {
        if (value !== null) {
            schemas[key] = {validate: ajv.compile(value)};
        }
    } 
    return schemas;
}