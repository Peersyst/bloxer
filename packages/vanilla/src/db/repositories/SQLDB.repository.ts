import { EntityConstructor } from "../entities";
import { InstanceOf } from "../../utils/types";
import { DBRepository } from "./DB.repository";
import { DBAdapter } from "./adapters/db/interfaces";
import { SQLAdapter } from "./adapters/sql";

export abstract class SQLDBRepository<Entity extends EntityConstructor> extends DBRepository<Entity> {
    constructor(
        protected readonly db: DBAdapter,
        entity: Entity,
        protected readonly sqlAdapter: SQLAdapter<Entity>,
    ) {
        super(entity);
    }

    async findOne(...where: Partial<InstanceOf<Entity>>[]): Promise<InstanceOf<Entity> | undefined> {
        const row = await this.db.get(this.sqlAdapter.buildSelect(...where));
        return row ? this.entity.fromRow(this.sqlAdapter.sqlRowToRecord(row)) : undefined;
    }

    async findAll(...where: Partial<InstanceOf<Entity>>[]): Promise<InstanceOf<Entity>[]> {
        const rows = await this.db.all(this.sqlAdapter.buildSelect(...where));
        return rows.map((row) => this.entity.fromRow(this.sqlAdapter.sqlRowToRecord(row)));
    }

    async create(data: InstanceOf<Entity>): Promise<InstanceOf<Entity>> {
        await this.db.create(this.sqlAdapter.buildInsert(data));
        return data;
    }

    async update(data: Partial<InstanceOf<Entity>>, ...where: Partial<InstanceOf<Entity>>[]): Promise<void> {
        await this.db.update(this.sqlAdapter.buildSetClause(data, ...where));
    }

    async delete(...where: Partial<InstanceOf<Entity>>[]): Promise<void> {
        await this.db.delete(this.sqlAdapter.buildDelete(...where));
    }
}
