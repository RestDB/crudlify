import q2m from 'query-to-mongo';
// Q2M implementation

/**
 * Convert request query to mongoDB query by query-to-mongo lib
 * @param {*} query 
 * @param {*} headers 
 * @returns Object
 */
export function getMongoQuery(query, headers) {
    let options = {};
    if (query.q) {
        try {
            options.filter = JSON.parse(query.q || "{}");
            options.hints = JSON.parse(query.h || "{}");
        } catch (error) {
            debug(error)
            return res.status(400).end(error.message);
        }
    } else {
        const mongoQuery = q2m(query);
        options = {
            filter: mongoQuery.criteria
        }
        if (mongoQuery.options.fields) {
            options.hints = { $fields: mongoQuery.options.fields }
        }
        if (mongoQuery.options.limit) {
            options.limit = mongoQuery.options.limit
        }
        if (mongoQuery.options.skip) {
            options.offset = mongoQuery.options.skip
        }
    }
    return options;
}