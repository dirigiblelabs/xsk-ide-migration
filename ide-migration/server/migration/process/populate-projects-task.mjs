import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { configurations as config } from "@dirigible/core";
import { TrackService } from "../api/track-service";
import { DiffToolService } from "../api/diff-tool-executor.mjs";
const repositoryManager = require("platform/v4/repository");

export class PopulateProjectsTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("POPULATING_PROJECTS", "MIGRATION_EXECUTED", "POPULATING_PROJECTS_FAILED");
    }

    run() {
        const userDataJson = process.getVariable(this.execution.getId(), "userData");
        const userData = JSON.parse(userDataJson);

        const migrationService = new MigrationService();
        const workspace = userData.workspace;
        for (const deliveryUnit of userData.du) {

            const workspaceName = "workspace";
            const projectName = deliveryUnit.projectName

            const workspacePath = `${deliveryUnit.fromZip ? "temp/migrations/" : ""}${workspaceName}`

            const repositoryPath = `${workspacePath}/${projectName}`;
            const duRootCollection = repositoryManager.getCollection(repositoryPath);

            function localHandler(collection, localName) {
                const local = collection.getResource(localName);
                const repositoryPath = local.getPath();

                const runLocation = repositoryPath.substring(`/${workspacePath}`.length);
                const relativePath = runLocation.substring(`/${projectName}.length`);
                //add non generated
                console.log(">>>>>> ADDING FILE  >>>> " + relativePath);
                migrationService.addFileToWorkspace(workspaceName, repositoryPath, relativePath, projectName)


            }

            visitCollection(duRootCollection, localHandler);

            function visitCollection(collection, handler) {
                const localNames = collection.getResourcesNames();

                for (const name of localNames) {

                    handler(collection, name);
                }
                const subcollectionNames = collection.getCollectionsNames();
                for (const name of subcollectionNames) {
                    visitCollection(collection.getCollection(name), localHandler);
                }

            }

            //add generated files
            console.log(">>>>>> ADDING NO GENERATED FILES >>>>")
            const generatedFiles = deliveryUnit["deployableArtifactsResult"]["generated"].filter((x) => x.projectName === projectName);
            for (const generatedFile of generatedFiles) {
                migrationService.addFileToWorkspace(workspace, generatedFile.repositoryPath, generatedFile.relativePath, generatedFile.projectName);
            }
            migrationService.handleHDBTableFunctions(workspace, projectName);

            //modify files
            console.log(">>>>>> INTERCEPTING FILES >>>>")
            migrationService.interceptProject(workspace, projectName);

            //commit
            console.log(">>>>>> COMMITING CHANGES >>>>")
            migrationService.commitProjectModificationsWithoutLoop(workspace, projectName);

        }

        process.setVariable(this.execution.getId(), "migrationState", "MIGRATION_EXECUTED");
        this.trackService.updateMigrationStatus("MIGRATION EXECUTED");

        const workspaceHolderFolder = config.get("user.dir") + "/target/dirigible/repository/root"
        const diffTool = new DiffToolService();
        const diffViewData = diffTool.diffFolders(`${workspaceHolderFolder}/${workspace}_unmodified`, `${workspaceHolderFolder}/${workspace}`);
        migrationService.removeTemporaryFolders(workspace);
        process.setVariable(this.execution.getId(), "diffViewData", JSON.stringify(diffViewData));
    }
}
