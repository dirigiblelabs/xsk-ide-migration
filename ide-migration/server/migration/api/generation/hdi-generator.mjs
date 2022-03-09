import { getHdiFilePlugins } from "../repository/hdi-plugins";
import { bytes } from "@dirigible/io";
import { configurations } from "@dirigible/core";
import { getOrCreateTemporaryProjectCollection, getOrCreateTemporaryWorkspaceCollection } from "./temporary-collections-provider.mjs";

const HANA_USERNAME = "HANA_USERNAME";

export class HdiGenerator {
    
    createHdiConfigFile(workspaceName, project) {
        const hdiConfig = getHdiFilePlugins();

        const projectName = project.getName();
        const hdiConfigPath = `${projectName}.hdiconfig`;
        const hdiConfigJson = JSON.stringify(hdiConfig, null, 4);
        const hdiConfigJsonBytes = bytes.textToByteArray(hdiConfigJson);

        const workspaceCollection = getOrCreateTemporaryWorkspaceCollection(workspaceName);
        const projectCollection = getOrCreateTemporaryProjectCollection(workspaceCollection, projectName);
        let localResource = projectCollection.createResource(hdiConfigPath, hdiConfigJsonBytes);

        return {
            repositoryPath: localResource.getPath(),
            relativePath: hdiConfigPath,
            projectName: projectName,
        };
    }

    createHdiFile(workspaceName, project, hdiConfigPath, deployables) {
        const projectName = project.getName();
        const defaultHanaUser = configurations.get(HANA_USERNAME, "DBADMIN");

        const hdi = {
            configuration: `/${projectName}/${hdiConfigPath.relativePath}`,
            users: [defaultHanaUser],
            group: projectName,
            container: projectName,
            deploy: deployables,
            undeploy: [],
        };

        const hdiPath = `${projectName}.hdi`;
        const hdiJson = JSON.stringify(hdi, null, 4);
        const hdiJsonBytes = bytes.textToByteArray(hdiJson);

        const workspaceCollection = getOrCreateTemporaryWorkspaceCollection(workspaceName);
        const projectCollection = getOrCreateTemporaryProjectCollection(workspaceCollection, projectName);
        let localResource = projectCollection.createResource(hdiPath, hdiJsonBytes);

        return {
            repositoryPath: localResource.getPath(),
            relativePath: hdiPath,
            projectName: projectName,
        };
    }
}