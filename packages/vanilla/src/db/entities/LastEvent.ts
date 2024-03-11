import { Entity } from "./Entity";

/**
 * Entity used to store the last event processed.
 * There are 2 types of `LastEvent`:
 * - Only `block`: Stores the upcoming block to be processed.
 * - `block`, `event`, `hash`: Stores the last event processed. The indexer will start indexing from the next event.
 */
export class LastEvent extends Entity("last_event") {
    block: number;
    event?: string;
    hash?: string;

    constructor(block: number, event?: string, hash?: string) {
        super();
        this.block = block;
        this.event = event;
        this.hash = hash;
    }
}
