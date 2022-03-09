import { workspace as workspaceManager, repository as repositoryManager } from "@dirigible/platform";
import { client as git } from "@dirigible/git";

import { isHdbSynonym, isCalculationView, isTableFunction } from "./file-type-resolver.mjs";
import { ProjectFileContentTransformer } from "./transformations/project-file-content-transformer.mjs";
import { SynonymsGenerator } from "./generation/synonyms-generator.mjs";
import { HdiGenerator } from "./generation/hdi-generator.mjs";
import { getOrCreateTemporaryProjectCollection, getOrCreateTemporaryWorkspaceCollection } from "./temporary-collections-provider.mjs";
import { migrationInputStateStore } from "./state/migration-input-state.mjs";

export class MigrationService {
    tableFunctionPaths = [];

    projectFileContentTransformer = new ProjectFileContentTransformer();
    synonymsGenerator = new SynonymsGenerator();
    hdiGenerator = new HdiGenerator();

    copyFilesLocally(deliveryUnitsProvider, workspaceName, lists) {
        const workspaceCollection = getOrCreateTemporaryWorkspaceCollection(workspaceName);
        const unmodifiedWorkspaceCollection = getOrCreateTemporaryWorkspaceCollection(workspaceName + "_unmodified");
        const hdbFacade = new XSKHDBCoreFacade();

        const locals = [];
        for (const file of lists) {
            let fileRunLocation = file.RunLocation;

            // each file's package id is based on its directory
            // if we do not get only the first part of the package id, we would have several XSK projects created for directories in the same XS app
            const projectName = file.packageId.split(".")[0];

            if (fileRunLocation.startsWith("/" + projectName)) {
                // remove package id from file location in order to remove XSK project and folder nesting
                fileRunLocation = fileRunLocation.slice(projectName.length + 1);
            }
            let content = deliveryUnitsProvider.getDeliveryUnitFileContent(file);

            const unmodifiedProjectCollection = getOrCreateTemporaryProjectCollection(
                unmodifiedWorkspaceCollection,
                projectName
            );
            unmodifiedProjectCollection.createResource(fileRunLocation, content);

            if (isCalculationView(fileRunLocation)) {
                content = this.projectFileContentTransformer.transformCalculationView(content);
            } else if (isTableFunction(fileRunLocation)) {
                content = this.projectFileContentTransformer.removeSchemasAndTransformViewReferencesInTableFunction(content);
            }

            const projectCollection = getOrCreateTemporaryProjectCollection(workspaceCollection, projectName);
            const localResource = projectCollection.createResource(fileRunLocation, content);

            const synonyms = this.synonymsGenerator.createSynonyms(file, content, workspaceCollection, hdbFacade);

            // Add any generated synonym files to locals
            locals.push(...synonyms.hdbSynonyms);
            locals.push(...synonyms.hdbPublicSynonyms);

            locals.push({
                repositoryPath: localResource.getPath(),
                relativePath: fileRunLocation,
                projectName: projectName,
                runLocation: file.RunLocation,
            });
        }

        return locals;
    }

    handlePossibleDeployableArtifacts(workspaceName, deployables) {
        let generatedFiles = [];
        let updatedFiles = [];
        for (const deployable of deployables) {
            if (deployable.artifacts && deployable.artifacts.length > 0) {
                const hdiConfigPath = this.hdiGenerator.createHdiConfigFile(workspaceName, deployable.project);
                generatedFiles.push(hdiConfigPath);
                let hdiPath = this.hdiGenerator.createHdiFile(workspaceName, deployable.project, hdiConfigPath, deployable.artifacts);
                generatedFiles.push(hdiPath);
            }
        }

        return { generated: generatedFiles, updated: updatedFiles };
    }

    createMigratedWorkspace(workspaceName) {
        let workspace;
        if (!workspaceName) {
            workspace = workspaceManager.getWorkspace(workspaceName);
            if (!workspace) {
                workspaceManager.createWorkspace(workspaceName);
            }
        }
        workspace = workspaceManager.getWorkspace(workspaceName);

        return workspace;
    }

    collectDeployables(workspaceName, filePath, runLocation, projectName, oldDeployables) {
        let workspace = workspaceManager.getWorkspace(workspaceName);
        if (!workspace) {
            workspaceManager.createWorkspace(workspaceName);
            workspace = workspaceManager.getWorkspace(workspaceName);
        }

        const deployables = oldDeployables;

        let project = workspace.getProject(projectName);
        if (!project) {
            workspace.createProject(projectName);
            project = workspace.getProject(projectName);
        }

        if (!deployables.find((x) => x.projectName === projectName)) {
            deployables.push({
                project: project,
                projectName: projectName,
                artifacts: [],
            });
        }

        if (
            filePath.endsWith(".analyticprivilege") ||
            filePath.endsWith(".hdbanalyticprivilege") ||
            filePath.endsWith(".hdbflowgraph" ||
                isCalculationView(filePath) ||
                isTableFunction(filePath)) ||
                isHdbSynonym(filePath)
        ) {
            console.log("!!!! VM: filePath: " + filePath);
            deployables.find((x) => x.projectName === projectName).artifacts.push(runLocation);
        }

        return deployables;
    }

    addFileToWorkspace(workspaceName, repositoryPath, relativePath, projectName) {
        const workspace = workspaceManager.getWorkspace(workspaceName);
        const project = workspace.getProject(projectName);

        if (project.existsFile(relativePath)) {
            project.deleteFile(relativePath);
        }

        const projectFile = project.createFile(relativePath);
        const resource = repositoryManager.getResource(repositoryPath);
        projectFile.setContent(resource.getContent());
    }

    addFilesWithoutGenerated(localFiles) {
        const workspaceName = migrationInputStateStore.getState().selectedWorkspaceName;

        for (const localFile of localFiles) {
            this.addFileToWorkspace(workspace, localFile.repositoryPath, localFile.relativePath, localFile.projectName);
            const projectName = localFile.projectName;
            let repos = git.getGitRepositories(workspace);
            let repoExists = false;
            for (const repo of repos) {
                if (repo.getName() === projectName) {
                    repoExists = true;
                    break;
                }
            }
            if (repoExists) {
                git.commit("migration", "", workspaceName, projectName, "Overwrite existing project", true);
            } else {
                console.log("Initializing repository...");
                git.initRepository("migration", "", workspaceName, projectName, projectName, "Migration initial commit");
            }
        }
    }

    addGeneratedFiles(userData, deliveryUnit, workspace, localFiles) {
        for (const localFile of localFiles) {
            const projectName = localFile.projectName;
            const generatedFiles = deliveryUnit.deployableArtifactsResult.generated.filter((x) => x.projectName === projectName);
            for (const generatedFile of generatedFiles) {
                this.addFileToWorkspace(workspace, generatedFile.repositoryPath, generatedFile.relativePath, generatedFile.projectName);
            }
        }
    }
}
