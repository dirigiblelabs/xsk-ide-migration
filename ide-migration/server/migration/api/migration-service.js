const HanaRepository = require('ide-migration/server/migration/repository/hana-repository');
const workspaceManager = require("platform/v4/workspace");
const repositoryManager = require("platform/v4/repository");
const bytes = require("io/v4/bytes");
const database = require("db/v4/database");
const config = require("core/v4/configurations");
const HANA_USERNAME = "HANA_USERNAME";
const TransformerFactory = Java.type("javax.xml.transform.TransformerFactory");
const StreamSource = Java.type("javax.xml.transform.stream.StreamSource");
const StreamResult = Java.type("javax.xml.transform.stream.StreamResult")
const StringReader = Java.type("java.io.StringReader")
const StringWriter = Java.type("java.io.StringWriter")

class MigrationService {

    connection = null;
    repo = null;

    setupConnection(databaseName, databaseUser, databaseUserPassword, connectionUrl) {
        database.createDataSource(databaseName, "com.sap.db.jdbc.Driver", connectionUrl, databaseUser, databaseUserPassword, null);

        this.connection = database.getConnection('dynamic', databaseName);
        this.repo = new HanaRepository(this.connection);
    }

    getAllDeliveryUnits() {
        if (!this.repo) {
            throw new Error("Repository not initialized");
        }

        return this.repo.getAllDeliveryUnits();
    }

    handlePossibleDeployableArtifacts(deployables) {
        for (const deployable of deployables) {
            if (deployable.artifacts && deployable.artifacts.length > 0) {
                const hdiConfigPath = this.createHdiConfigFile(deployable.project);
                this.createHdiFile(deployable.project, hdiConfigPath, deployable.artifacts);
            }
        }
    }

    createHdiConfigFile(project) {
        const hdiConfig = {
            file_suffixes: {
                hdbcalculationview: {
                    plugin_name: "com.sap.hana.di.calculationview",
                    plugin_version: "12.1.0"
                },
                calculationview: {
                    plugin_name: "com.sap.hana.di.calculationview",
                    plugin_version: "12.1.0"
                }
            }
        };

        const projectName = project.getName();
        const hdiConfigPath = `${projectName}.hdiconfig`;
        const hdiConfigFile = project.createFile(hdiConfigPath);
        const hdiConfigJson = JSON.stringify(hdiConfig, null, 4);
        const hdiConfigJsonBytes = bytes.textToByteArray(hdiConfigJson);
        hdiConfigFile.setContent(hdiConfigJsonBytes);

        return hdiConfigPath;
    }

    createHdiFile(project, hdiConfigPath, deployables) {
        const projectName = project.getName();
        const defaultHanaUser = this.getDefaultHanaUser();

        const hdi = {
            configuration: `/${projectName}/${hdiConfigPath}`,
            users: [defaultHanaUser],
            group: projectName,
            container: projectName,
            deploy: deployables,
            undeploy: []
        };

        const hdiPath = `${projectName}.hdi`;
        const hdiFile = project.createFile(`${projectName}.hdi`);
        const hdiJson = JSON.stringify(hdi, null, 4);
        const hdiJsonBytes = bytes.textToByteArray(hdiJson);
        hdiFile.setContent(hdiJsonBytes);

        return hdiPath;
    }

    getDefaultHanaUser() {
        return config.get(HANA_USERNAME, "DBADMIN");
    }

    copyFilesLocally(workspaceName, lists) {
        const workspaceCollection = this._getOrCreateTemporaryWorkspaceCollection(workspaceName);

        const locals = [];
        for (const file of lists) {
            let fileRunLocation = file.RunLocation;

            // each file's package id is based on its directory
            // if we do not get only the first part of the package id, we would have several XSK projects created for directories in the same XS app
            const projectName = file.packageId.split('.')[0];

            if (fileRunLocation.startsWith("/" + projectName)) {
                // remove package id from file location in order to remove XSK project and folder nesting
                fileRunLocation = fileRunLocation.slice(projectName.length + 1);
            }
            let content = this.repo.getContentForObject(file._name, file._packageName, file._suffix);

            const projectCollection = this._getOrCreateTemporaryProjectCollection(workspaceCollection, projectName);
            const localResource = projectCollection.createResource(fileRunLocation, content);
            
            locals.push({ 
                repositoryPath: localResource.getPath(),
                relativePath: fileRunLocation, 
                projectName: projectName, 
                runLocation: file.RunLocation 
            })
        }
        return locals;
    }

    _getOrCreateTemporaryWorkspaceCollection(workspaceName) {
        const existing = repositoryManager.getCollection(workspaceName);
        if (existing) {
            return existing;
        }

        return repositoryManager.createCollection(workspaceName);
    }

    _getOrCreateTemporaryProjectCollection(workspaceCollection, projectName) {
        const existing = workspaceCollection.getCollection(projectName);
        if (existing) {
            return existing;
        }

        return workspaceCollection.createCollection(projectName);
    }

    createMigratedWorkspace(workspaceName, du) {
        let workspace;
        if (!workspaceName) {
            workspace = workspaceManager.getWorkspace(du.name)
            if (!workspace) {
                workspaceManager.createWorkspace(du.name)
                workspace = workspaceManager.getWorkspace(du.name)
            }
        }
        workspace = workspaceManager.getWorkspace(workspaceName);

        return workspace;
    }

    collectDeployables(workspaceName, filePath, runLocation, projectName, oldDeployables) {

        let workspace = workspaceManager.getWorkspace(workspaceName)
        if (!workspace) {
            workspaceManager.createWorkspace(workspaceName)
            workspace = workspaceManager.getWorkspace(workspaceName)
        }

        const deployables = oldDeployables;

        let project = workspace.getProject(projectName)
        if (!project) {
            workspace.createProject(projectName)
            project = workspace.getProject(projectName)
        }

        if (!deployables.find(x => x.projectName === projectName)) {
            deployables.push({
                project: project,
                projectName: projectName,
                artifacts: []
            });
        }

        if (filePath.endsWith('hdbcalculationview')
            || filePath.endsWith('calculationview')) {
            deployables.find(x => x.projectName === projectName).artifacts.push(runLocation);
        }

        return deployables;
    }

    addFileToWorkspace(workspaceName, repositoryPath, relativePath, projectName) {
        const workspace = workspaceManager.getWorkspace(workspaceName)
        const project = workspace.getProject(projectName)
        const projectFile = project.createFile(relativePath);
        const resource = repositoryManager.getResource(repositoryPath);
        projectFile.setContent(resource.getContent());
    }

    getAllFilesForDU(du) {
        let context = {};
        const filesAndPackagesObject = this.repo.getAllFilesForDu(context, du);
        return filesAndPackagesObject.files;
    }

}

module.exports = MigrationService;


