import { registerAs } from '@nestjs/config';
import { IStorageConfiguration } from './storage.configuration.interface';

const storageConfiguration = registerAs(
    'storage',
    function createStorageConfiguration(): IStorageConfiguration {
        return {
            connectionString: process.env.AZURE_STORAGE_CONNECTION_LINK || '',
            sasBlobObjectsUrl: process.env.AZURE_STORAGE_SAS_BLOB_OBJECTS_URL || '',
            sasFilesUrl: process.env.AZURE_STORAGE_SAS_FILES_URL || '',
            sasTablesUrl: process.env.AZURE_STORAGE_SAS_TABLES_URL || '',
        }
    }
)
export { storageConfiguration };