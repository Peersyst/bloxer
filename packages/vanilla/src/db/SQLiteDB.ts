import { cached as sqliteCached } from "sqlite3";
import { open as openSQLite, Database } from "sqlite";
import { SQLiteRepository } from "./repositories";
import { EntityConstructor } from "./entities";
import { exists, outputFile } from "fs-extra";
import { DB } from "./interfaces";

/**
 * SQLite Database implementation of DB
 */
export class SQLiteDB implements DB {
    private _db: Database | undefined;
    private get db(): Database {
        if (!this._db) throw new Error(`SQLite Database ${this.filename} not initialized`);
        return this._db;
    }
    private set db(db: Database | undefined) {
        this._db = db;
    }

    constructor(private readonly filename) {}

    async open(): Promise<void> {
        // Check if the database file exists, if not create it
        const existsDB = await exists(this.filename);
        if (!existsDB) outputFile(this.filename, "");

        this.db = await openSQLite({
            filename: this.filename,
            driver: sqliteCached.Database,
        });

        await this.db.migrate({
            migrationsPath: `${__dirname}/migrations`,
        });
    }

    async close(): Promise<void> {
        await this.db.close();
        this.db = undefined;
    }

    getRepository<Entity extends EntityConstructor>(entity: Entity): SQLiteRepository<Entity> {
        return new SQLiteRepository(this.db, entity);
    }
}
