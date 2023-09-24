import { Provider } from "@bloxer/vanilla";
import { Client } from "xrpl";

export class XrplProvider extends Provider<typeof Client.prototype.request> {
    private readonly client: Client;
    private connectPromise: Promise<void> | undefined;

    readonly request: typeof Client.prototype.request;

    constructor(wsUrl: string) {
        super(wsUrl);

        this.client = new Client(wsUrl);

        this.request = this.client.request.bind(this.client);
    }

    connect(): void {
        this.connectPromise = this.client.connect();
    }

    waitConnection(): Promise<void> {
        return this.connectPromise;
    }

    setListeners(): void {
        this.client.on("connected", () => this.emit("connected"));
        this.client.on("disconnected", () => this.emit("disconnected"));
        this.client.on("error", (error) => this.emit("error", error));
        this.client.on("ledgerClosed", (ledger) => this.emit("block", ledger.ledger_index));
    }

    async subscribeToLatestBlock(): Promise<void> {
        await this.request({
            command: "subscribe",
            streams: ["ledger"],
        });
    }

    async unsubscribeFromLatestBlock(): Promise<void> {
        await this.request({
            command: "unsubscribe",
            streams: ["ledger"],
        });
    }

    async disconnect(): Promise<void> {
        await this.client.disconnect();
    }

    isConnected(): boolean {
        return this.client.isConnected();
    }
}
