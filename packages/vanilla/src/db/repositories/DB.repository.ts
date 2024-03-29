import { EntityConstructor } from "../entities";
import { InstanceOf } from "../../utils/types";
import { DBWhere } from "./types";

export abstract class DBRepository<Entity extends EntityConstructor> {
    constructor(protected readonly entity: Entity) {}

    /**
     * Finds one resource from the DB.
     * @param where The where clauses (will be joined with OR).
     * @returns The resource or undefined if no resource is found.
     */
    abstract findOne(where?: DBWhere<Entity>): Promise<InstanceOf<Entity> | undefined>;

    /**
     * Returns all resources from the DB matching the given wheres.
     * @param where The where clauses (will be joined with OR).
     * @returns The found resources.
     */
    abstract findAll(where?: DBWhere<Entity>): Promise<InstanceOf<Entity>[]>;

    /**
     * Creates a resource in the DB.
     * @param data The data to insert.
     * @returns The created resource.
     */
    abstract create(data: InstanceOf<Entity>): Promise<InstanceOf<Entity>>;

    /**
     * Updates a resource in the DB.
     * @param data The data to update.
     * @param where The where clauses (will be joined with OR).
     */
    abstract update(data: Partial<InstanceOf<Entity>>, where?: DBWhere<Entity>): Promise<void>;

    /**
     * Deletes a resource from the DB.
     * @param where The where clauses (will be joined with OR).
     */
    abstract delete(where?: DBWhere<Entity>): Promise<void>;

    /**
     * Updates a resource in the DB or creates it if it does not exist.
     * @param data The data to update or create.
     * @param where The where clauses (will be joined with OR).
     * @returns The created resource if it was created, otherwise void.
     */
    abstract updateOrCreate(data: Partial<InstanceOf<Entity>>, where?: DBWhere<Entity>): Promise<InstanceOf<Entity> | void>;
}
