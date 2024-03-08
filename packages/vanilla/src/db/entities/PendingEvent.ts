import { Entity } from "./Entity";

export class PendingEvent extends Entity("pending_event") {
    event: string;
    hash: string;
    block: number;
    data: any[];

    static fromEventNotification(event: string, hash: string, block: number, ...data: any[]): PendingEvent {
        return {
            event,
            hash,
            block,
            data: data.length ? data : undefined,
        };
    }
}
