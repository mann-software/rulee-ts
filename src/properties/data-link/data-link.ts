
/**
 * Interface to import/export/synchronize data of properties
 */
export interface DataLink<D> {

    /**
     * Export the data, e.g. to store it somewhere
     */
    exportData(): D | null;

    /**
     * Import some external data, e.g. received from somewhere
     * Keep in mind: There are also data provider like ObjectValueProvider
     * that keep external data in sync
     * 
     * @param data external Data
     */
    importData(data: D | null): void;

    // todo: put this in extra interface and implement diff, but also implement for diff an enabled flag
    compareData(a: D | null, b: D | null): boolean;
}
