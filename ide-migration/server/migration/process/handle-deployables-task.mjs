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
import { migrationDB } from "../api/migration-db.mjs";

export class HandleDeployablesTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("HANDLE_DEPLOYABLES_EXECUTING", "HANDLE_DEPLOYABLES_EXECUTED", "HANDLE_DEPLOYABLES_FAILED");
    }

    run() {
        const userDataJson = process.getVariable(this.execution.getId(), "userData");
        const userData = JSON.parse(userDataJson);

        console.log("START ITERATING DUs")
        const migrationService = new MigrationService();
        try {

            for (const deliveryUnit of userData.du) {
                const locals = deliveryUnit.locals;
                if (!(locals && locals.length > 0)) {
                    continue;
                }


                let deployables = [];
                let workspace;
                let projectName = deliveryUnit.name;
                let project;
                console.log("LOCALS ARE " + JSON.stringify(locals));
                try {
                    console.log("WORKSPACE IS " + userData.workspace)
                    workspace = migrationService.getOrCreateWorkspace(userData.workspace);
                    console.log("PROJECT NAME IS " + projectName);
                    project = migrationService.getOrCreateProject(workspace, projectName);
                } catch (err) {
                    console.log("ERROR BEFORE COLLECTING " + err)
                }

                console.log("START COLLECTING DEPLOYABLES");
                for (const local of locals) {
                    const details = migrationDB.getFileDetails(local.fileId);
                    console.log("DETAILS IS " + JSON.stringify(details));
                    deployables = migrationService.collectDeployables(
                        workspace,
                        details.repositoryPath,
                        details.runLocation,
                        details.projectName,
                        project,
                        deployables
                    );
                }
                console.log("FINISH COLLECTING DEPLOYABLES");
                // Get names of projects with generated synonyms and add them to deployables
                const projectsWithSynonyms = migrationService.getProjectsWithSynonyms(locals);
                const synonymsPaths = migrationService.checkExistingSynonymTypes(locals)
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

        } catch (err) {
            console.log("ERROR  :" + err);
        }




        process.setVariable(this.execution.getId(), "userData", JSON.stringify(userData));
    }
}
