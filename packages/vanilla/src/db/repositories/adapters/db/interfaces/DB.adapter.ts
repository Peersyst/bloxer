import { AnyObject } from "@swisstype/essential";

/**
 * DB adapters are used by repositories to interact with the database.
 */
export interface DBAdapter {
    /**
     * Returns a single resource from the database.
     * @param query The get query to execute.
     */
    get(query: string): Promise<AnyObject>;

    /**
     * Returns a list of resources from the database.
     * @param query The get query to execute.
     */
    all(query: string): Promise<AnyObject[]>;

    /**
     * Creates a resource in the database.
     * @param query The create query to execute.
     */
    create(query: string): Promise<void>;

    /**
     * Updates a resource in the database.
     * @param query The update query to execute.
     */
    update(query: string): Promise<void>;

    /**
     * Deletes a resource from the database.
     * @param query The delete query to execute.
     */
    delete(query: string): Promise<void>;
}
