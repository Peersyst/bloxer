import { Entity } from "./Entity";

export class LastEvent extends Entity("last_event") {
    event: string;
    hash: string;
    block: number;
}
