import Debug from 'debug';
const debug = Debug("json-schema validator");

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