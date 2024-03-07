import { Database } from "sqlite";
import { EntityConstructor } from "../entities";
import { SQLDBRepository } from "./SQLDB.repository";
import { SQLiteDBAdapter } from "./adapters";

export class SQLiteRepository<Entity extends EntityConstructor> extends SQLDBRepository<Entity> {
    constructor(db: Database, entity: Entity) {
        super(new SQLiteDBAdapter(db), entity);
    }
}
