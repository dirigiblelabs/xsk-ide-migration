import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { migrationDB } from "../api/migration-db.mjs";

export class CopyFilesTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("COPY_FILES_EXECUTING", "COPY_FILES_EXECUTED", "COPY_FILES_FAILED");
    }

    run() {
        const userDataJson = process.getVariable(this.execution.getId(), "userData");
        const userData = JSON.parse(userDataJson);
        const userDatabaseData = userData.hana;
        const connectionUrl = process.getVariable(this.execution.getId(), "connectionUrl");

        const migrationService = new MigrationService();
        migrationService.removeTemporaryFolders(userData.workspace);

        console.log("TABLES CRAETED... START ITERATING DUS")

        for (const deliveryUnit of userData.du) {
            migrationService.setupConnection(
                userDatabaseData.databaseSchema,
                userDatabaseData.username,
                userDatabaseData.password,
                connectionUrl
            );
            console.log("ADDING DU DETAILS")

            const files = migrationService.getAllFilesForDU(deliveryUnit);
            if (files) {
                let filesDetails = [];
                const duName = deliveryUnit.name;
                let duObjectId = migrationDB.addDuDetails(composeJson(duName));
                const locals = migrationService.copyFilesLocally(userData.workspace, duName, files);

                console.log("START ITERATING LOCALS")
                for (const localFile of locals) {
                    const repositoryPath = localFile.repositoryPath;
                    const runLocation = localFile.runLocation;
                    const relativePath = localFile.relativePath;

                    let fileDetails = {
                        repositoryPath: repositoryPath,
                        relativePath: "/" + relativePath,
                        projectName: duName,
                        runLocation: "/" + runLocation,
                        deliveryUnitId: duObjectId
                    };

                    console.log("ADD FILE DETAILS")
                    let fileId = migrationDB.addFileDetails(fileDetails)
                    //filesDetails.push(fileDetails)
                    filesDetails.push({ fileId });
                }
                //deliveryUnit.locals = locals;
                deliveryUnit.locals = filesDetails;
                deliveryUnit.duObject = duObjectId;
                console.log(JSON.stringify(deliveryUnit));
                console.log("REACHED")
            }
        }

        function composeJson(projectName) {
            let duObject = {}
            duObject.ach = "";
            duObject.caption = "";
            duObject.lastUpdate = getFormattedDate();
            duObject.ppmsID = "";
            duObject.responsible = "";
            duObject.sp_PPMS_ID = "";
            duObject.vendor = "migration.sap.com";
            duObject.version = "";
            duObject.version_patch = "";
            duObject.version_sp = "";
            duObject.name = projectName;
            return duObject;
        }

        function getFormattedDate() {
            let date = new Date();
            let dateStr = date.getFullYear() + "-" +
                ("00" + (date.getMonth() + 1)).slice(-2) + "-" +
                ("00" + date.getDate()).slice(-2) + " " +
                ("00" + date.getHours()).slice(-2) + ":" +
                ("00" + date.getMinutes()).slice(-2) + ":" +
                ("00" + date.getSeconds()).slice(-2);
            return dateStr
        }

        process.setVariable(this.execution.getId(), "userData", JSON.stringify(userData));
    }


}
