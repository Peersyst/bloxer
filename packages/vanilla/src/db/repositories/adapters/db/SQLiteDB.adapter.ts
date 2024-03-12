import { AnyObject } from "@swisstype/essential";
import { DBAdapter } from "./interfaces";
import { Database } from "sqlite";
import { DBQueryParameters } from "../../types";

/**
 * Implements the `DBAdapter` for an SQLite database.
 */
export class SQLiteDBAdapter implements DBAdapter {
    constructor(private readonly db: Database) {}

    get(query: string, parameters?: DBQueryParameters): Promise<AnyObject | undefined> {
        return this.db.get(query, parameters);
    }

    all(query: string, parameters?: DBQueryParameters): Promise<AnyObject[]> {
        return this.db.all(query, parameters);
    }

    async create(query: string, parameters?: DBQueryParameters): Promise<void> {
        await this.db.run(query, parameters);
    }

    async update(query: string, parameters?: DBQueryParameters): Promise<void> {
        await this.db.run(query, parameters);
    }

    async delete(query: string, parameters?: DBQueryParameters): Promise<void> {
        await this.db.run(query, parameters);
    }
}
