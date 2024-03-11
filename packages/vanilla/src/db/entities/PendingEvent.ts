import { Entity } from "./Entity";

/**
 * Entity used to store the pending events to be processed.
 */
export class PendingEvent<Event extends string = string, Data extends any[] = any[]> extends Entity("pending_event") {
    /**
     * The event name.
     */
    event: Event;
    /**
     * The hash of the event. Normally the transaction hash.
     */
    hash: string;
    /**
     * The optional index of the event.
     */
    i?: number;
    /**
     * The block of the event.
     */
    block: number;
    /**
     * The data of the event.
     */
    data: Data;
}
