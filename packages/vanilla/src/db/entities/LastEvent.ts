import { Entity } from "./Entity";

export class LastEvent extends Entity("last_event") {
    hash: string;
    block: number;
}
