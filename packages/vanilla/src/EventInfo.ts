import { PendingEvent } from "./db/entities";

export class EventInfo<Event extends string = string> {
    event: Event;
    hash: string;
    i?: number;
    block: number;

    static fromPendingEvent<Event extends string = string>({ event, hash, i, block }: PendingEvent<Event>): EventInfo<Event> {
        return {
            event,
            hash,
            i,
            block,
        };
    }
}

export type ListenerWithEventInfo<Event extends string, Listener extends (...args: any[]) => any[]> = (
    ...args: [...Parameters<Listener>, EventInfo<Event>]
) => ReturnType<Listener>;

export type EventsWithEventInfo<EventsDef extends Record<string, (...args: any[]) => any>> = {
    [Event in keyof EventsDef]: ListenerWithEventInfo<Event extends string ? Event : never, EventsDef[Event]>;
};
