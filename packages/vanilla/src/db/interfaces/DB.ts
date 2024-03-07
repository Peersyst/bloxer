import { DBRepository } from "../repositories";
import { EntityConstructor } from "../entities";

export interface DB {
    /**
     * Opens the database connection.
     */
    open(): Promise<void>;

    /**
     * Closes the database connection.
     */
    close(): Promise<void>;

    /**
     * Returns a repository for the given entity.
     */
    getRepository<Entity extends EntityConstructor>(entity: Entity): DBRepository<Entity>;
}
