import { Provider } from "@bloxer/vanilla";
import { ethers } from "ethers";

export class EthersProvider extends Provider<typeof ethers.providers.WebSocketProvider.prototype.send> {
    protected provider: ethers.providers.WebSocketProvider;

    private providerIsConnected = false;

    request: typeof ethers.providers.WebSocketProvider.prototype.send = function () {
        throw new Error("EvmProvider not connected");
    };

    /**
     * [ws](https://github.com/websockets/ws/tree/d8dd4852b81982fc0a6d633673968dff90985000) is used under the hood by ethers.
     * @see https://github.com/websockets/ws/blob/d8dd4852b81982fc0a6d633673968dff90985000/doc/ws.md
     */
    get websocket(): {
        on: (event: string, listener: () => void) => void;
        off: (event: string, listener: () => void) => void;
        close: (code: number) => void;
    } {
        // Types in ethers are not accurate
        return this.provider.websocket as any;
    }

    constructor(wsUrl: string) {
        super(wsUrl);
    }

    connect(): void {
        // Create the websocket provider
        this.provider = new ethers.providers.WebSocketProvider(this.wsUrl);
        // Bind the request method
        this.request = this.provider.send.bind(this.provider);
    }

    async waitConnection(): Promise<void> {
        await this.provider._ready();
    }

    setListeners(): void {
        this.websocket.on("open", () => {
            this.providerIsConnected = true;
            this.emit("connected");
        });
        this.websocket.on("close", () => {
            this.providerIsConnected = false;
            this.emit("disconnected");
        });
        this.websocket.on("error", ((error) => {
            this.providerIsConnected = false;
            this.emit("error", error);
        }) as any); // Avoid throwing unhandled errors
    }

    async subscribeToLatestBlock(): Promise<void> {
        await Promise.resolve(this.provider.on("block", (block: number) => this.emit("block", block)));
    }

    async unsubscribeFromLatestBlock(): Promise<void> {
        await Promise.resolve(this.provider.off("block", (block: number) => this.emit("block", block)));
    }

    disconnect(): Promise<void> {
        /**
         * `providerIsConnected` is set to false in the `close` listener.
         * Nevertheless, we set it here as well just in case
         */
        this.providerIsConnected = false;
        this.provider.websocket.close(1000);
        return Promise.resolve();
    }

    isConnected(): boolean {
        return this.providerIsConnected;
    }
}
