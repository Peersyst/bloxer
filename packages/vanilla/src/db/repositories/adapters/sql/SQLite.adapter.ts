import { EntityConstructor } from "../../../entities";
import { SQLAdapter } from "./SQL.adapter";

/**
 * An SQLite adapter extended from the SQL adapter.
 */
export class SQLiteAdapter<Entity extends EntityConstructor> extends SQLAdapter<Entity> {
    valueToSql<T = any>(value: T): string {
        if (typeof value === "string") return `'${value}'`;
        else if (value === undefined || value === null) return "NULL";
        else if (typeof value === "object") return `X'${Buffer.from(JSON.stringify(value), "utf-8").toString("hex")}'`;
        else return value.toString();
    }

    sqlToValue<T = any>(sqlValue: any): T {
        if (typeof sqlValue === "string") return sqlValue as T;
        else if (Buffer.isBuffer(sqlValue)) return JSON.parse(sqlValue.toString("utf-8"));
        return sqlValue === null ? undefined : sqlValue;
    }
}
