import q2m from 'query-to-mongo';
import Debug from 'debug';
const debug = Debug("crudlify q2m");

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
            if (options.hints.limit) options.limit = options.hints.limit;
            if (options.hints.offset) options.offset = options.hints.offset;
        } catch (error) {
            debug(error)
            return res.status(400).end(error.message);
        }
    } else {
        const mongoQuery = q2m(query);
        debug(mongoQuery);

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
    return options;
}