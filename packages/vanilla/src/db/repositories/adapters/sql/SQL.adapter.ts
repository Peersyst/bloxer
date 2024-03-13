import { EntityConstructor } from "../../../entities";
import { InstanceOf } from "../../../../utils/types";
import { AnyObject } from "@swisstype/essential";
import { DBQueryParameters, DBWhere } from "../../types";

/**
 * SQL adapter used to adapt JS values to SQL for given entity.
 */
export abstract class SQLAdapter<Entity extends EntityConstructor> {
    constructor(protected readonly entity: Entity) {}

    /**
     * Transforms a JS value to its SQL value.
     * @param value The JS value.
     * @returns The SQL value.
     */
    abstract valueToSql<T = any>(value: T): any;

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
    buildWhereClause(where?: DBWhere<Entity>): [query: string, parameters: DBQueryParameters] | undefined {
        const whereGroups = Array.isArray(where) ? where : [where];

        if (whereGroups.length === 0 || whereGroups[0] === undefined) return undefined;

        const whereGroupClauses: string[] = [];
        const parameters: DBQueryParameters = {};

        for (let i = 0; i < whereGroups.length; i++) {
            const whereGroupConditions: string[] = [];

            for (const [key, value] of Object.entries(this.entity.toRow(whereGroups[i]))) {
                const parameterKey = `:${key}_wg_${i}`;
                whereGroupConditions.push(`${key} = ${parameterKey}`);
                parameters[parameterKey] = this.valueToSql(value);
            }

            whereGroupClauses.push(whereGroupConditions.join(" AND "));
        }

        const query = `WHERE ${whereGroupClauses.join(" OR ")}`;

        return [query, parameters];
    }

    /**
     * Adds a where clause to a query.
     * @param query The query.
     * @param where The where clauses (will be joined with OR).
     * @returns The resulting query.
     */
    withWhereClause(query: string, where?: DBWhere<Entity>): [query: string, parameters?: DBQueryParameters] {
        const whereClauseResult = this.buildWhereClause(where);
        return whereClauseResult ? [`${query} ${whereClauseResult[0]}`, whereClauseResult[1]] : [query];
    }

    /**
     * Builds a select query.
     * @param where The where clauses (will be joined with OR).
     * @returns The select query.
     */
    buildSelect(where?: DBWhere<Entity>): [query: string, parameters?: DBQueryParameters] {
        return this.withWhereClause(
            `SELECT *
        FROM ${this.entity.table}`,
            where,
        );
    }

    /**
     * Builds an insert query.
     * @param data The data to insert.
     * @returns The insert query.
     */
    buildInsert(data: InstanceOf<Entity>): [query: string, parameters: DBQueryParameters] {
        const rowData = this.entity.toRow(data);

        const keys: string[] = [];
        const parameterKeys: string[] = [];
        const parameters: DBQueryParameters = {};

        for (const [key, value] of Object.entries(rowData)) {
            keys.push(key);
            const parameterKey = `:${key}_i`;
            parameterKeys.push(parameterKey);
            parameters[parameterKey] = this.valueToSql(value);
        }

        const query = `INSERT INTO ${this.entity.table} (${keys.join(", ")})
        VALUES (${parameterKeys.join(", ")})`;

        return [query, parameters];
    }

    /**
     * Builds an update query.
     * @param data The data to update.
     * @param where The where clauses (will be joined with OR).
     * @returns The update query.
     */
    buildSetClause(data: Partial<InstanceOf<Entity>>, where?: DBWhere<Entity>): [query: string, parameters: DBQueryParameters] {
        const setClauses: string[] = [];
        const parameters: DBQueryParameters = {};

        for (const [key, value] of Object.entries(this.entity.toRow(data))) {
            const parameterKey = `:${key}_s`;
            setClauses.push(`${key} = ${parameterKey}`);
            parameters[parameterKey] = this.valueToSql(value);
        }

        const [query, whereParameters = {}] = this.withWhereClause(
            `UPDATE ${this.entity.table}
        SET ${setClauses.join(", ")}`,
            where,
        );

        return [query, { ...whereParameters, ...parameters }];
    }

    /**
     * Builds a delete query.
     * @param where The where clauses (will be joined with OR).
     * @returns The delete query.
     */
    buildDelete(where?: DBWhere<Entity>): [query: string, parameters?: DBQueryParameters] {
        return this.withWhereClause(`DELETE FROM ${this.entity.table}`, where);
    }
}
