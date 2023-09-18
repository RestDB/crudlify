const debug = console.debug;

/**
 * 
 * @param {*} schema 
 * @param {*} document 
 * @returns 
 */
export const validate = (schema, document) => {
    debug('Validate', document, schema)
    return schema.validate(document)
}

export const cast = (schema, document) => {
    debug('Cast', document, schema)
    return schema.cast(document)
}

export const prepare = (schemas) => {
    debug('Yup prep')
    return schemas;   
}