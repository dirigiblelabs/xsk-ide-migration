var dao = require("db/v4/dao");

class MigrationDB {

    filesDetailsRef;
    duDetailsRef;

    constructor() {
        this.filesDetailsRef = this.createLocalFileDetailsTable();
        this.duDetailsRef = this.createDuTable();
    }

    createLocalFileDetailsTable() {

        var fileDetailsRef = dao.create({
            table: `LOCAL_FILE_DETAILS`,
            properties: [{
                name: "id",
                column: "ID",
                type: "BIGINT",
                id: true
            }, {
                name: "repositoryPath",
                column: "REPOSITORY_PATH",
                type: "VARCHAR",
                required: true
            }, {
                name: "relativePath",
                column: "RELATIVE_PATH",
                type: "VARCHAR",
                required: true
            }, {
                name: "projectName",
                column: "PROJECT_NAME",
                type: "VARCHAR",
                required: true
            }, {
                name: "runLocation",
                column: "RUN_LOCATION",
                type: "VARCHAR",
                required: true
            }, {
                name: "deliveryUnitId",
                column: "DELIVERY_UNIT_ID",
                type: "BIGINT",
                required: true
            }]
        });

        //Create CUSTOMERS table
        try {
            fileDetailsRef.createTable();
        } catch (err) {
            console.log(err.message)
        }


        return fileDetailsRef;
    }

    createDuTable() {

        var tableRef = dao.create({
            table: `DELIVERY_UNIT`,
            properties: [{
                name: "id",
                column: "ID",
                type: "BIGINT",
                id: true
            }, {
                name: "ach",
                column: "ACH",
                type: "VARCHAR",
                required: false
            }, {
                name: "lastUpdate",
                column: "LAST_UPDATE",
                type: "VARCHAR",
                required: false
            }, {
                name: "ppmsID",
                column: "PPMS_ID",
                type: "VARCHAR",
                required: true
            }, {
                name: "responsible",
                column: "RESPONSIBLE",
                type: "VARCHAR",
                required: true
            }, {
                name: "sp_PPMS_ID",
                column: "SP_PPMS_ID",
                type: "VARCHAR",
                required: true
            }, {
                name: "vendor",
                column: "VENDOR",
                type: "VARCHAR",
                required: true
            }, {
                name: "version",
                column: "VERSION",
                type: "VARCHAR",
                required: true
            }, {
                name: "version_patch",
                column: "VERSION_PATCH",
                type: "VARCHAR",
                required: true
            }, {
                name: "version_sp",
                column: "VERSION_SP",
                type: "VARCHAR",
                required: true
            }, {
                name: "name",
                column: "NAME",
                type: "VARCHAR",
                required: true
            }]
        });

        try {
            tableRef.createTable();
        } catch (err) {
            console.log(err.message)
        }

        return tableRef;

    }

    addDuDetails(data) {
        try {
            var recordId = this.duDetailsRef.insert(data);
            return recordId;
        } catch (err) {
            console.log(err.message)
        }
    }

    addFileDetails(details) {

        try {
            var fileDetailsId = this.filesDetailsRef.insert(details);
            return fileDetailsId;
        } catch (err) {
            console.log(err.message)
        }
    }

    getFileDetails(id) {
        var details = this.filesDetailsRef.find(id);
        return details;
    }
}

export const migrationDB = new MigrationDB();

// Object.freeze(migrationDB);

// export default migrationDB;