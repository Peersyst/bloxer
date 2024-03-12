import { Entity } from "./Entity";

/**
 * Entity used to store the last event processed.
 * There are 2 types of `LastEvent`:
 * - Only `block`: Stores the upcoming block to be processed.
 * - `block`, `event`, `hash`: Stores the last event processed. The indexer will start indexing from the next event.
 */
export class LastEvent<Event extends string = string> extends Entity("last_event") {
    /**
     * The block of the event.
     */
    block: number;
    /**
     * The event name.
     */
    event?: Event;
    /**
     * The hash of the event. Normally the transaction hash.
     */
    hash?: string;
    /**
     * The optional index of the event.
     */
    i?: number;
}
