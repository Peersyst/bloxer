import { AnyObject } from "@swisstype/essential";
import { Entity } from "./Entity";

export class PendingEvent extends Entity("pending_event") {
    event: string;
    hash: string;
    block: number;
    data: AnyObject;

    static fromEventNotification(event: string, hash: string, block: number, ...data: AnyObject[]): PendingEvent {
        return {
            event,
            hash,
            block,
            data: data.length ? data : undefined,
        };
    }
}
