import { Database } from "sqlite";
import { EntityConstructor } from "../entities";
import { SQLDBRepository } from "./SQLDB.repository";
import { SQLiteDBAdapter } from "./adapters/db";
import { SQLiteAdapter } from "./adapters/sql";

export class SQLiteRepository<Entity extends EntityConstructor> extends SQLDBRepository<Entity> {
    constructor(db: Database, entity: Entity) {
        super(new SQLiteDBAdapter(db), entity, new SQLiteAdapter(entity));
    }
}
