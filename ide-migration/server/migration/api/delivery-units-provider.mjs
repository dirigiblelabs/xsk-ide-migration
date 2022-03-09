import { database } from "@dirigible/db";

export class DeliveryUnitsProvider {

    hanaRepository = null;

    constructor(userDatabaseCredentials, databaseUrl) {
        this.hanaRepository = this._createHanaRepository(
            userDatabaseCredentials.databaseSchema, 
            userDatabaseCredentials.username, 
            userDatabaseCredentials.password,
            databaseUrl
        );
    }

    _createHanaRepository(databaseName, databaseUser, databaseUserPassword, databaseUrl) {
        database.createDataSource(databaseName, "com.sap.db.jdbc.Driver", databaseUrl, databaseUser, databaseUserPassword, null);

        const connection = database.getConnection("dynamic", databaseName);
        return new HanaRepository(connection);
    }

    getAllDeliveryUnitNames() {
        if (!this.hanaRepository) {
            throw new Error("Repository not initialized");
        }

        return this.hanaRepository.getAllDeliveryUnits();
    }

    getAllDeliveryUnitFilesMetadata(du) {
        let context = {};
        const filesAndPackagesObject = this.hanaRepository.getAllFilesForDu(context, du);
        if (!filesAndPackagesObject) {
            return null;
        }
        return filesAndPackagesObject.files;
    }

    getDeliveryUnitFileContent(file) {
        this.hanaRepository.getContentForObject(file._name, file._packageName, file._suffix);
    }

}