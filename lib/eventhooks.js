import Debug from 'debug';
const debug = Debug("crudlify eventhooks");
/**
 * Event code hooks
 */
export class EventHooks {
    constructor() {
        this.listeners = {};
    }

    fireBefore(coll, verb, data) {
        debug("FIRE before hook")
        if (this.listeners[`${coll} before${verb}`]) {
            this.listeners[`${coll} before${verb}`](data)
        } else {
            debug('No hook for', coll, verb)
        }    
    }
    fireAfter(coll, verb, data) {
        debug("FIRE after hook")
        if (this.listeners[`${coll} after${verb}`]) {
            this.listeners[`${coll} after${verb}`](data)
        } else {
            debug('No hook for', coll, verb)
        }
        
    }

    beforePUT(coll, func) {
        debug('On event', coll, func)
        this.listeners[`${coll} beforePUT`] = func;
        return this;
    }

    beforePOST(coll, func) {
        debug('Before event', coll, func)
        this.listeners[`${coll} beforePOST`] = func;
        return this;
    }
    afterPOST(coll, func) {
        debug('After event', coll, func)
        this.listeners[`${coll} afterPOST`] = func;
        return this;
    }

    beforePATCH(coll, func) {
        debug('On event', coll, func)
        this.listeners[`${coll} beforePATCH`] = func;
        return this;
    }
    beforeDELETE(coll, func) {
        debug('On event', coll, func)
        this.listeners[`${coll} beforeDELETE`] = func;
        return this;
    }
}