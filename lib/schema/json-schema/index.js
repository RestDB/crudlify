//z-schema method
let validator = null;
const debug = console.debug;

/**
 * 
 * @param {*} schema 
 * @param {*} document 
 * @returns 
 */
export const validate = (schema, document, options) => {
    debug('Validate', document, schema)
    return new Promise((resolve, reject) => {
        const valid = options.validator.validate(document, schema);
        debug('isValid', valid)
        if (!valid) {
            reject(options.validator.getLastErrors());
        } else {
            resolve(document);
        }
    })
}

/*
var validator = new ZSchema();


// now validate our data against the last schema
var valid = validator.validate(data, schemas[2]);
*/

export const cast = (schema, document) => {
    debug('Cast', document, schema)
    return document;
}

export const prepare = (schemas, options) => {
    validator = options.validator;
    debug('Json-schema prep', options)
    return schemas;   
}