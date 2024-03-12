import { InstanceOf } from "../../utils/types";
import { EntityConstructor } from "../entities";

/**
 * Represents the parameters that can be passed to a query.
 * @example `{ :id: 1 }` for the query `SELECT * FROM table WHERE id = :id`.
 */
export type DBQueryParameters = Record<`:${string}`, any>;

/**
 * Represents a where clause for a query.
 */
export type DBWhereClause<Entity extends EntityConstructor> = Partial<InstanceOf<Entity>>;

/**
 * Represents a where clause or an array of where clauses for a query.
 */
export type DBWhere<Entity extends EntityConstructor> = DBWhereClause<Entity> | DBWhereClause<Entity>[];
