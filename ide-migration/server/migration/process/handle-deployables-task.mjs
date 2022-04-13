/*
 * Copyright (c) 2021 SAP SE or an SAP affiliate company and XSK contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Apache License, v2.0
 * which accompanies this distribution, and is available at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-FileCopyrightText: 2021 SAP SE or an SAP affiliate company and XSK contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
var repositoryManager = require("platform/v4/repository");

export class HandleDeployablesTask extends MigrationTask {
    execution = process.getExecutionContext();
    synonymFileName = "hdi-synonyms.hdbsynonym";
    publicSynonymFileName = "hdi-public-synonyms.hdbpublicsynonym";

    constructor() {
        super("HANDLE_DEPLOYABLES_EXECUTING", "HANDLE_DEPLOYABLES_EXECUTED", "HANDLE_DEPLOYABLES_FAILED");
    }

    getSynonymFilePath(projectName) {
        return "/" + projectName + "/" + this.synonymFileName;
    }

    getPublicSynonymFilePath(projectName) {
        return "/" + projectName + "/" + this.publicSynonymFileName;
    }

    run() {
        const userDataJson = process.getVariable(this.execution.getId(), "userData");
        const userData = JSON.parse(userDataJson);

        const migrationService = new MigrationService();

        for (const deliveryUnit of userData.du) {

            const projectName = deliveryUnit.projectName;

            const projectSynonymPath = this.getSynonymFilePath(projectName);
            const projectPublicSynonymPath = this.getPublicSynonymFilePath(projectName);
            let deployables = [];
            let synonymsPaths = [];
            let projectsWithSynonyms = [];

            const workspaceName = "workspace";
            const workspacePath = `${deliveryUnit.fromZip ? "temp/migrations/" : ""}${workspaceName}`

            const repositoryPath = `${workspacePath}/${projectName}`;
            const duRootCollection = repositoryManager.getCollection(repositoryPath);


            function localHandler(collection, localName) {
                const local = collection.getResource(localName);
                const repositoryPath = local.getPath();
                const runLocation = repositoryPath.substring(`/${workspacePath}`.length);
                if (runLocation === projectSynonymPath || runLocation === projectPublicSynonymPath) {
                    if (!projectsWithSynonyms.includes(projectName)) {
                        projectsWithSynonyms.push(projectName);
                    }
                    if (!synonymsPaths.includes(runLocation)) {
                        synonymsPaths.push(runLocation);
                    }
                }
                console.log(local.getPath());
                deployables = migrationService.collectDeployables(
                    userData.workspace,
                    repositoryPath,
                    runLocation,
                    projectName,
                    deployables
                );
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

            // Get names of projects with generated synonyms and add them to deployables
            // const projectsWithSynonyms = getProjectsWithSynonyms(deliveryUnit.projectName);
            // const projectsWithSynonyms = [deliveryUnit.projectName];
            // const synonymsPaths = migrationService.checkExistingSynonymTypes(locals)
            if (projectsWithSynonyms) {
                for (const projectName of projectsWithSynonyms) {
                    const projectDeployables = deployables.find((x) => x.projectName === projectName).artifacts;
                    projectDeployables.push(...synonymsPaths);
                }
            }



            deliveryUnit["deployableArtifactsResult"] =
                migrationService.handlePossibleDeployableArtifacts(
                    deliveryUnit.name,
                    userData.workspace,
                    deployables
                );
        }
        process.setVariable(this.execution.getId(), "userData", JSON.stringify(userData));
    }
}
