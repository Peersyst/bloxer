import { Entity } from "./Entity";

/**
 * Entity used to store the pending events to be processed.
 */
export class PendingEvent extends Entity("pending_event") {
    event: string;
    hash: string;
    block: number;
    data: any[];

    constructor(event: string, hash: string, block: number, ...data: any[]) {
        super();
        this.event = event;
        this.hash = hash;
        this.block = block;
        this.data = data;
    }
}
