import { existsSync, readFileSync, writeFileSync } from "fs";
import { getAttribute } from "./utils";
import type { IndexerState } from "./types";
import type { DeepPick, NestedKeys } from "./utils.types";

export class IndexerStateRepository<State extends IndexerState = IndexerState> {
    /**
     * Allows to cache the state in memory.
     */
    private currentState: State;

    constructor(private readonly stateFilePath: string) {}

    /**
     * Reads the state from the file or returns an initial state if the file does not exist.
     * @returns The state.
     */
    private readState(): State {
        if (existsSync(this.stateFilePath)) return JSON.parse(readFileSync(this.stateFilePath).toString()) as State;
        else return {} as State;
    }

    /**
     * Writes the state to the file.
     * @param state The state to write.
     */
    private writeState(state: State): void {
        return writeFileSync(this.stateFilePath, JSON.stringify(state));
    }

    /**
     * Gets the state or a nested property from the state.
     * @param key An optional nested key
     * @returns The state or a nested property from the state.
     */
    get<Key extends NestedKeys<State> | void = void>(key?: Key): Key extends NestedKeys<State> ? DeepPick<State, Key> : State {
        if (!this.currentState) this.currentState = this.readState();

        let result;

        if (key) result = getAttribute(this.currentState, key as NestedKeys<State>);
        else result = this.currentState;

        return result as Key extends NestedKeys<State> ? DeepPick<State, Key> : State;
    }

    /**
     * Sets the state.
     * @param state The state to set.
     */
    set(state: State): void {
        this.writeState(state);
        this.currentState = state;
    }

    /**
     * Sets a partial state.
     * @param state The partial state to set.
     */
    setPartial(state: Partial<State>): void {
        this.set({ ...this.get(), ...state } as State);
    }
}
