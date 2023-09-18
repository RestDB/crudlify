const debug = console.debug;

/**
 * 
 * @param {*} schema 
 * @param {*} document 
 * @returns 
 */
export const validate = (schema, document) => {
    return new Promise((resolve, reject) => {
        debug('Validate', document)
        try {
            resolve(schema.parse(document));
        } catch (ex) {
            reject(ex.issues);
        }
    })
}

export const cast = (schema, document) => {
    debug('Cast', document, schema)
    return document;
}

export const prepare = (schemas) => {
    debug('Zod prep')
    return schemas;   
}