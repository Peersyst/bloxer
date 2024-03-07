import { EntityConstructor } from "../entities";
import { InstanceOf } from "../../utils/types";
import { DBRepository } from "./DB.repository";
import { SQLBuilder } from "../utils/SQLBuilder";
import { DBAdapter } from "./adapters/interfaces";

export abstract class SQLDBRepository<Entity extends EntityConstructor> extends DBRepository<Entity> {
    private readonly sqlBuilder: SQLBuilder<Entity>;

    constructor(
        protected readonly db: DBAdapter,
        entity: Entity,
    ) {
        super(entity);

        this.sqlBuilder = new SQLBuilder(entity);
    }

    async findOne(...where: Partial<InstanceOf<Entity>>[]): Promise<InstanceOf<Entity>> {
        const row = await this.db.get(this.sqlBuilder.buildSelect(...where));
        return row ? this.entity.fromRow(row) : undefined;
    }

    async findAll(...where: Partial<InstanceOf<Entity>>[]): Promise<InstanceOf<Entity>[]> {
        const rows = await this.db.all(this.sqlBuilder.buildSelect(...where));
        return rows.map((row) => this.entity.fromRow(row));
    }

    async create(data: InstanceOf<Entity>): Promise<InstanceOf<Entity>> {
        await this.db.create(this.sqlBuilder.buildInsert(data));
        return data;
    }

    async update(data: Partial<InstanceOf<Entity>>, ...where: Partial<InstanceOf<Entity>>[]): Promise<void> {
        await this.db.update(this.sqlBuilder.buildSetClause(data, ...where));
    }

    async delete(...where: Partial<InstanceOf<Entity>>[]): Promise<void> {
        await this.db.delete(this.sqlBuilder.buildDelete(...where));
    }
}
