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
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class HandleDeployablesTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("HANDLE_DEPLOYABLES_EXECUTING", "HANDLE_DEPLOYABLES_EXECUTED", "HANDLE_DEPLOYABLES_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();
        const selectedWorkspaceName = migrationState.selectedWorkspaceName;

        const migrationService = new MigrationService();
        for (const deliveryUnit of migrationState.selectedDeliveryUnitNames) {
            const locals = deliveryUnit.locals;
            if (!(locals && locals.length > 0)) {
                continue;
            }
            let deployables = [];
            for (const local of locals) {
                deployables = migrationService.collectDeployables(
                    selectedWorkspaceName,
                    local.repositoryPath,
                    local.runLocation,
                    local.projectName,
                    deployables
                );
            }

            deliveryUnit.deployableArtifactsResult = migrationService.handlePossibleDeployableArtifacts(selectedWorkspaceName, deployables);
        }
    }
}
