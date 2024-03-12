import { AnyObject } from "@swisstype/essential";
import { DBQueryParameters } from "../../../types";

/**
 * DB adapters are used by repositories to interact with the database.
 */
export interface DBAdapter {
    /**
     * Returns a single resource from the database.
     * @param query The get query to execute.
     * @parameters The parameters to use in the query.
     */
    get(query: string, parameters?: DBQueryParameters): Promise<AnyObject>;

    /**
     * Returns a list of resources from the database.
     * @param query The get query to execute.
     * @parameters The parameters to use in the query.
     */
    all(query: string, parameters?: DBQueryParameters): Promise<AnyObject[]>;

    /**
     * Creates a resource in the database.
     * @param query The create query to execute.
     * @parameters The parameters to use in the query.
     */
    create(query: string, parameters?: DBQueryParameters): Promise<void>;

    /**
     * Updates a resource in the database.
     * @param query The update query to execute.
     * @parameters The parameters to use in the query.
     */
    update(query: string, parameters?: DBQueryParameters): Promise<void>;

    /**
     * Deletes a resource from the database.
     * @param query The delete query to execute.
     * @parameters The parameters to use in the query.
     */
    delete(query: string, parameters?: DBQueryParameters): Promise<void>;
}
