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
const MigrationController = require('ide-migration/server/migration/controllers/migrate');

const process = require('bpm/v4/process');
const execution = process.getExecutionContext();

process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTING');

const userDataJson = process.getVariable(execution.getId(), 'userData');
const userData = JSON.parse(userDataJson);
const userDatabaseData = userData.hana;

const migrationController = new MigrationController();
migrationController.setupConnection(userDatabaseData.databaseSchema, userDatabaseData.username, userDatabaseData.password);

migrationController.copyAllFilesForDu(userData.du, userData.workspace, err => {
  process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
})

while (true) {
  const status = process.getVariable(execution.getId(), 'migrationState');
  if (status === "MIGRATION_EXECUTED") {
    break;
  }
}