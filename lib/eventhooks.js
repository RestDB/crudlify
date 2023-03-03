import Debug from 'debug';
const debug = Debug("crudlify eventhooks");
/**
 * Event code hooks middleware
 */
export class EventHooks {
    constructor() {
        this.listeners = {};
    }

    /**
     * Before hook
     * @param {*} coll 
     * @param {*} verb 
     * @param {*} data 
     */
    async fireBefore(coll, verb, data) {
        debug("FIRE before hook")
        if (this.listeners[`${coll} before${verb}`]) {
            await this.listeners[`${coll} before${verb}`](data)
        } else {
            debug('No hook for', coll, verb)
        }    
    }

    /**
     * After hook
     * @param {*} coll 
     * @param {*} verb 
     * @param {*} data 
     */
    async fireAfter(coll, verb, data) {
        debug("FIRE after hook")
        if (this.listeners[`${coll} after${verb}`]) {
            await this.listeners[`${coll} after${verb}`](data)
        } else {
            debug('No hook for', coll, verb)
        }
        
    }
    /**
     * Codehook called before data is updated in database
     * @param {*} coll 
     * @param {*} func 
     * @returns 
     */
    beforePUT(coll, func) {
        debug('On event', coll, func)
        this.listeners[`${coll} beforePUT`] = func;
        return this;
    }

    /**
     * Codehook called before data is inserted into database
     * @param {*} coll 
     * @param {*} func 
     * @returns 
     */
    beforePOST(coll, func) {
        debug('Before event', coll, func)
        this.listeners[`${coll} beforePOST`] = func;
        return this;
    }
    /**
     * 
     * @param {*} coll 
     * @param {*} func 
     * @returns 
     */
    afterPOST(coll, func) {
        debug('After event', coll, func)
        this.listeners[`${coll} afterPOST`] = func;
        return this;
    }

    /**
     * 
     * @param {*} coll 
     * @param {*} func 
     * @returns 
     */
    beforePATCH(coll, func) {
        debug('On event', coll, func)
        this.listeners[`${coll} beforePATCH`] = func;
        return this;
    }
    /**
     * 
     * @param {*} coll 
     * @param {*} func 
     * @returns 
     */
    beforeDELETE(coll, func) {
        debug('On event', coll, func)
        this.listeners[`${coll} beforeDELETE`] = func;
        return this;
    }
}