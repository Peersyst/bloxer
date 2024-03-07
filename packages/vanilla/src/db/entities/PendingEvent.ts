import { AnyObject } from "@swisstype/essential";
import { Entity } from "./Entity";

export class PendingEvent extends Entity("pending_event") {
    event: string;
    hash: string;
    block: number;
    data: AnyObject;

    static fromRow(row: AnyObject): PendingEvent {
        return {
            event: row.event,
            hash: row.hash,
            block: row.block,
            data: JSON.parse(row.data),
        };
    }

    static toRow(row: PendingEvent): AnyObject {
        return {
            event: row.event,
            hash: row.hash,
            block: row.block,
            data: row.data ? JSON.stringify(row.data) : undefined,
        };
    }
}
