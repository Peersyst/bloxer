import { EntityConstructor } from "../entities";
import { InstanceOf } from "../../utils/types";

/**
 * SQL builder for an entity.
 */
export class SQLBuilder<Entity extends EntityConstructor> {
    constructor(protected readonly entity: Entity) {}

    /**
     * Builds a where clause.
     * @param where The where clauses (will be joined with OR).
     * @returns The where clause or undefined if no where clauses are provided.
     */
    buildWhereClause(...where: Partial<InstanceOf<Entity>>[]): string | undefined {
        if (where.length === 0) return undefined;

        return `WHERE ${where
            .map((whereGroup) =>
                Object.entries(
                    this.entity.toRow(
                        // Casted to `InstanceOf<Entity>`, `Entity.toRow` will have to handle possible undefined values
                        whereGroup as InstanceOf<Entity>,
                    ),
                )
                    .map((key, value) => `${key} = ${value}`)
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
        return `INSERT INTO ${this.entity.table} (${Object.keys(data).join(", ")})
        VALUES (${Object.values(this.entity.toRow(data)).join(", ")})`;
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
        SET ${Object.entries(
            this.entity.toRow(
                // Casted to `InstanceOf<Entity>`, `Entity.toRow` will have to handle possible undefined values
                data as InstanceOf<Entity>,
            ),
        )
            .map((key, value) => `${key} = ${value}`)
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
