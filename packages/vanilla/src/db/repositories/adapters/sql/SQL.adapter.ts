import { EntityConstructor } from "../../../entities";
import { InstanceOf } from "../../../../utils/types";
import { AnyObject } from "@swisstype/essential";

/**
 * SQL adapter used to adapt JS values to SQL for given entity.
 */
export abstract class SQLAdapter<Entity extends EntityConstructor> {
    constructor(protected readonly entity: Entity) {}

    /**
     * Transforms a JS value to its SQL value.
     * @param value The JS value.
     * @returns The SQL value as string.
     */
    abstract valueToSql<T = any>(value: T): string;

    /**
     * Transforms an SQL value to its JS value.
     * @param value The SQL value.
     * @returns The JS value.
     */
    abstract sqlToValue<T = any>(sqlValue: any): T;

    /**
     * Transforms an SQL row to a JS record.
     * @param row The SQL row.
     * @returns The JS record.
     */
    sqlRowToRecord<T extends AnyObject>(sqlRow: AnyObject): T {
        const record = {};
        for (const [key, sqlValue] of Object.entries(sqlRow)) {
            record[key] = this.sqlToValue(sqlValue);
        }
        return record as T;
    }

    /**
     * Builds a where clause.
     * @param where The where clauses (will be joined with OR).
     * @returns The where clause or undefined if no where clauses are provided.
     */
    buildWhereClause(...where: Partial<InstanceOf<Entity>>[]): string | undefined {
        if (where.length === 0) return undefined;

        return `WHERE ${where
            .map((whereGroup) =>
                Object.entries(this.entity.toRow(whereGroup))
                    .map(([key, value]) => `${key} = ${this.valueToSql(value)}`)
                    .join(" AND "),
            )
            .join(" OR ")}`;
    }

    /**
     * Adds a where clause to a query.
     * @param query The query.
     * @param where The where clauses (will be joined with OR).
     * @returns The resulting query.
     */
    withWhereClause(query: string, ...where: Partial<InstanceOf<Entity>>[]): string {
        const whereClause = this.buildWhereClause(...where);
        return whereClause ? `${query} ${whereClause}` : query;
    }

    /**
     * Builds a select query.
     * @param where The where clauses (will be joined with OR).
     * @returns The select query.
     */
    buildSelect(...where: Partial<InstanceOf<Entity>>[]): string {
        return this.withWhereClause(
            `SELECT *
        FROM ${this.entity.table}`,
            ...where,
        );
    }

    /**
     * Builds an insert query.
     * @param data The data to insert.
     * @returns The insert query.
     */
    buildInsert(data: InstanceOf<Entity>): string {
        const rowData = this.entity.toRow(data);
        return `INSERT INTO ${this.entity.table} (${Object.keys(rowData).join(", ")})
        VALUES (${Object.values(rowData)
            .map((value) => this.valueToSql(value))
            .join(", ")})`;
    }

    /**
     * Builds an update query.
     * @param data The data to update.
     * @param where The where clauses (will be joined with OR).
     * @returns The update query.
     */
    buildSetClause(data: Partial<InstanceOf<Entity>>, ...where: Partial<InstanceOf<Entity>>[]): string {
        return this.withWhereClause(
            `UPDATE ${this.entity.table}
        SET ${Object.entries(this.entity.toRow(data))
            .map(([key, value]) => `${key} = ${this.valueToSql(value)}`)
            .join(", ")}`,
            ...where,
        );
    }

    /**
     * Builds a delete query.
     * @param where The where clauses (will be joined with OR).
     * @returns The delete query.
     */
    buildDelete(...where: Partial<InstanceOf<Entity>>[]): string {
        return this.withWhereClause(`DELETE FROM ${this.entity.table}`, ...where);
    }
}
