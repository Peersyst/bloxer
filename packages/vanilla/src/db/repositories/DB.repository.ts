import { EntityConstructor } from "../entities";
import { InstanceOf } from "../../utils/types";

export abstract class DBRepository<Entity extends EntityConstructor> {
    constructor(protected readonly entity: Entity) {}

    /**
     * Finds one resource from the DB.
     * @param where The where clauses (will be joined with OR).
     * @returns The resource or undefined if no resource is found.
     */
    abstract findOne(...where: Partial<InstanceOf<Entity>>[]): Promise<InstanceOf<Entity>>;

    /**
     * Returns all resources from the DB matching the given wheres.
     * @param where The where clauses (will be joined with OR).
     * @returns The found resources.
     */
    abstract findAll(...where: Partial<InstanceOf<Entity>>[]): Promise<InstanceOf<Entity>[]>;

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
    abstract update(data: Partial<InstanceOf<Entity>>, ...where: Partial<InstanceOf<Entity>>[]): Promise<void>;

    /**
     * Deletes a resource from the DB.
     * @param where The where clauses (will be joined with OR).
     */
    abstract delete(...where: Partial<InstanceOf<Entity>>[]): Promise<void>;
}
