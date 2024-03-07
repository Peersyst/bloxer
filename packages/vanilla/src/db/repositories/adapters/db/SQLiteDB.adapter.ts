import { AnyObject } from "@swisstype/essential";
import { DBAdapter } from "./interfaces";
import { Database } from "sqlite";

/**
 * Implements the `DBAdapter` for an SQLite database.
 */
export class SQLiteDBAdapter implements DBAdapter {
    constructor(private readonly db: Database) {}

    get(query: string): Promise<AnyObject | undefined> {
        return this.db.get(query);
    }

    all(query: string): Promise<AnyObject[]> {
        return this.db.all(query);
    }

    async create(query: string): Promise<void> {
        await this.db.run(query);
    }

    async update(query: string): Promise<void> {
        await this.db.run(query);
    }

    async delete(query: string): Promise<void> {
        await this.db.run(query);
    }
}
