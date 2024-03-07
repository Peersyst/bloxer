import { AnyObject } from "@swisstype/essential";

export interface EntityConstructor {
    // The entity type is set to `any` since the entity class is not known at compile time.
    // A constructor function must be defined in the interface so TS understands that another class can extend it.
    new (): any;
    table: string;
    fromRow(row: AnyObject): any;
    toRow(entity: any): AnyObject;
}

/**
 * Creates an entity class that has to be extended by all entities. Similar to a decorator.
 * @param table The table name of the entity.
 */
export function Entity(table: string): EntityConstructor {
    return class Entity {
        // Workaround to make the class abstract. Cannot return an abstract class from a function -.-.
        protected constructor() {}

        static readonly table = table;

        /**
         * Parse row into entity.
         * Can be overridden by the extending class to parse complex values.
         * @param row The row to parse.
         */
        static fromRow(row: AnyObject): Entity {
            return row;
        }

        /**
         * Transform entity into row.
         * Can be overridden by the extending class to parse complex values.
         * @param entity The entity to transform.
         */
        static toRow(entity: Entity): AnyObject {
            return entity;
        }
    } as EntityConstructor; // Has to be casted since the constructor is protected
}
