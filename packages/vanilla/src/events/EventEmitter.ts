import { EventEmitter as Emitter } from "events";

export class EventEmitter<EventsDef extends Record<string, (...args: any[]) => any>> {
    private emitter = new Emitter();

    /**
     * Emits an event with the given arguments.
     * @param event The event to emit.
     * @param args The arguments to pass to the event listeners.
     * @returns Returns `true` if the event had listeners, `false` otherwise.
     */
    emit<Event extends keyof EventsDef>(event: Event, ...args: Parameters<EventsDef[Event]>): boolean {
        return this.emitter.emit(event as string, ...args);
    }

    /**
     * Adds a **one-time**`listener` function for the specified event. The
     * next time `event` is triggered, this listener is removed and then invoked.
     * @param event The event.
     * @param listener The callback function
     * @returns A function that removes the listener.
     */
    once<Event extends keyof EventsDef>(event: Event, listener: EventsDef[Event]): () => void {
        this.emitter.once(event as string, listener);
        return () => this.off(event, listener);
    }

    /**
     * Adds the `listener` function to the end of the listeners array for the specified event.
     * @param event The event.
     * @param listener The callback function.
     * @returns A function that removes the listener.
     */
    on<Event extends keyof EventsDef>(event: Event, listener: EventsDef[Event]): () => void {
        this.emitter.on(event as string, listener);
        return () => this.off(event, listener);
    }

    /**
     * Removes the specified `listener` from the listener array for the specified event.
     * @param event The event.
     * @param listener The callback function.
     */
    off<Event extends keyof EventsDef>(event: Event, listener: EventsDef[Event]): void {
        this.emitter.off(event as string, listener);
    }
}
