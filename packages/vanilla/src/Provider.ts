import EventEmitter from "./EventEmitter";

export type ProviderEvents = {
    connected: () => void;
    disconnected: () => void;
    error: (error: any) => void;
    block: (block: number) => void;
};

export type ProviderEvent = keyof ProviderEvents;

export abstract class Provider<Request extends (...args: any[]) => Promise<any>> {
    private readonly eventEmitter = new EventEmitter<ProviderEvents>();

    protected readonly emit: typeof this.eventEmitter.emit;
    readonly on: typeof this.eventEmitter.on;
    readonly off: typeof this.eventEmitter.off;

    constructor(readonly wsUrl: string) {
        this.emit = this.eventEmitter.emit.bind(this.eventEmitter);
        this.on = this.eventEmitter.on.bind(this.eventEmitter);
        this.off = this.eventEmitter.off.bind(this.eventEmitter);
    }

    /**
     * Connect to the provider.
     */
    abstract connect(): void;
    /**
     * Wait for the connection to be established.
     */
    abstract waitConnection(): Promise<void>;
    /**
     * Set the listeners for the provider.
     */
    abstract setListeners(): void;
    /**
     * Subscribe to the latest block
     */
    abstract subscribeToLatestBlock(): Promise<void>;
    /**
     * Unsubscribe from the latest block
     */
    abstract unsubscribeFromLatestBlock(): Promise<void>;
    /**
     * Disconnect from the provider.
     */
    abstract disconnect(): Promise<void>;
    /**
     * Check if the provider is connected.
     */
    abstract isConnected(): boolean;
    /**
     * Send a request to the provider.
     */
    abstract request: Request;
}

export type ProviderConstructor<P extends Provider<any>> = {
    new (wsUrl: string): P;
};
