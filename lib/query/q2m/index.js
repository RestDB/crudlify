import q2m from './q2m.js';

/**
 * Convert request query to mongoDB query by query-to-mongo lib
 * @param {*} query 
 * @param {*} headers 
 * @returns Object
 */
export function getMongoQuery(query, headers) {
    console.debug('Create mongo query from url params', query)
    const mongoQuery = q2m(query);
    console.debug(mongoQuery);
    let options = {};
    if (query.q || query.h) {
        try {            
            options.filter = JSON.parse(query.q || "{}");
            options.hints = JSON.parse(query.h || "{}");
            if (!query.h) {
                options.hints = mongoQuery.options
            }            
            if (options.hints.limit) options.limit = options.hints.limit;
            if (options.hints.offset) options.offset = options.hints.offset;
            if (options.hints.fields) options.fields = options.hints.fields;
        } catch (error) {
            console.error('error in query or hints', error.message);
            throw Error(error.message);
        }
    } else {        

        options = {
            filter: mongoQuery.criteria,
            hints: mongoQuery.options
        }
        if (mongoQuery.options.fields) {
            options.hints.projection = mongoQuery.options.fields
        }
        if (mongoQuery.options.limit) {
            options.limit = mongoQuery.options.limit
        }
        if (mongoQuery.options.skip) {
            options.offset = mongoQuery.options.skip
        }
    }
    console.debug(options);
    return options;
}