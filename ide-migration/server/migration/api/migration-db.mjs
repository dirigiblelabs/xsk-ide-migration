var dao = require("db/v4/dao");

export class MigrationDB {

    setup(duName) {

    }

    static createLocalFileDetailsTable() {

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
        fileDetailsRef.createTable();

        return fileDetailsRef;
    }

    static createDuTable() {

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

        tableRef.createTable();

        return tableRef;

    }

    static addDuDetails(data, tableRef) {
        try {
            var recordId = tableRef.insert(data);
            return recordId;
        } catch (err) {
            console.log(err.message)
        }
    }

    static addFileDetails(details, tableRef) {

        try {
            var fileDetailsId = tableRef.insert(details);
            return fileDetailsId;
        } catch (err) {
            console.log(err.message)
        }
    }

    static getFileDetails(id, tableRef) {
        var details = tableRef.find(id);
        return details;
    }
}