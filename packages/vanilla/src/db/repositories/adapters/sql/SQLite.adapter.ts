import { EntityConstructor } from "../../../entities";
import { SQLAdapter } from "./SQL.adapter";

/**
 * An SQLite adapter extended from the SQL adapter.
 */
export class SQLiteAdapter<Entity extends EntityConstructor> extends SQLAdapter<Entity> {
    valueToSql<T = any>(value: T): any {
        if (value === undefined || value === null) return null;
        else if (typeof value === "object") return Buffer.from(JSON.stringify(value), "utf-8");
        else return value;
    }

    sqlToValue<T = any>(sqlValue: any): T {
        if (typeof sqlValue === "string") return sqlValue as T;
        else if (Buffer.isBuffer(sqlValue)) return JSON.parse(sqlValue.toString("utf-8"));
        return sqlValue === null ? undefined : sqlValue;
    }
}
