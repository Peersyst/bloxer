import { EntityConstructor } from "../entities";
import { InstanceOf } from "../../utils/types";
import { DBRepository } from "./DB.repository";
import { DBAdapter } from "./adapters/db/interfaces";
import { SQLAdapter } from "./adapters/sql";
import { DBWhere } from "./types";

export abstract class SQLDBRepository<Entity extends EntityConstructor> extends DBRepository<Entity> {
    constructor(
        protected readonly db: DBAdapter,
        entity: Entity,
        protected readonly sqlAdapter: SQLAdapter<Entity>,
    ) {
        super(entity);
    }

    async findOne(where?: DBWhere<Entity>): Promise<InstanceOf<Entity> | undefined> {
        const [query, parameters] = this.sqlAdapter.buildSelect(where);
        const row = await this.db.get(query, parameters);
        return row ? this.entity.fromRow(this.sqlAdapter.sqlRowToRecord(row)) : undefined;
    }

    async findAll(where?: DBWhere<Entity>): Promise<InstanceOf<Entity>[]> {
        const [query, parameters] = this.sqlAdapter.buildSelect(where);
        const rows = await this.db.all(query, parameters);
        return rows.map((row) => this.entity.fromRow(this.sqlAdapter.sqlRowToRecord(row)));
    }

    async create(data: InstanceOf<Entity>): Promise<InstanceOf<Entity>> {
        const [query, parameters] = this.sqlAdapter.buildInsert(data);
        await this.db.create(query, parameters);
        return data;
    }

    async update(data: Partial<InstanceOf<Entity>>, where: DBWhere<Entity>): Promise<void> {
        const [query, parameters] = this.sqlAdapter.buildSetClause(data, where);
        await this.db.update(query, parameters);
    }

    async delete(where?: DBWhere<Entity>): Promise<void> {
        const [query, parameters] = this.sqlAdapter.buildDelete(where);
        await this.db.delete(query, parameters);
    }

    async updateOrCreate(data: Partial<InstanceOf<Entity>>, where?: DBWhere<Entity>): Promise<InstanceOf<Entity> | void> {
        const row = await this.findOne(where);

        if (row) {
            return this.update(data, where);
        } else {
            return this.create(data as InstanceOf<Entity>);
        }
    }
}
