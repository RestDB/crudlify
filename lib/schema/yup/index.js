import Debug from 'debug';
const debug = Debug("yup validator");

export const validate = (schema, document) => {
    debug('Validate', document, schema)
    return schema.validate(document)
}

export const cast = (schema, document) => {
    debug('Cast', document, schema)
    return schema.cast(document)
}