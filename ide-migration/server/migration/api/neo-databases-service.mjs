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
// @ts-ignore
import { configurations } from "@dirigible/core";
import { MigrationToolExecutor } from "./migration-tool-executor";
const neoClientPath = configurations.get("user.dir") + "/target/dirigible/resources-neo-sdk/tools/neo.sh";
export class NeoDatabasesService {
    constructor(migrationToolExecutor = new MigrationToolExecutor()) {
        this.migrationToolExecutor = migrationToolExecutor;
    }
    getAvailableDatabases(account, host, jwtToken) {
        const script = `${neoClientPath} list-dbs -a "${account}" -h "${host}" -u JWT -p "${jwtToken}" --output json`;
        const rawCommandResult = this.migrationToolExecutor.execute(script, {
            "JAVA_HOME": configurations.get("JAVA8_HOME"),
            "PATH": configurations.get("JAVA8_HOME") + "/bin:" + configurations.get("PATH")
        });
        const commandResult = JSON.parse(rawCommandResult);
        if (commandResult.errorMsg) {
            throw "[NEO CLIENT ERROR]" + commandResult.errorMsg;
        }
        const rawDatabasesOutput = commandResult.commandOutput;
        const databases = this._parseDatabasesOutput(rawDatabasesOutput);
        return databases;
    }
    _parseDatabasesOutput(databasesOutput) {
        const databaseIdText = "Database ID";
        const databaseIndex = databasesOutput.indexOf(databaseIdText);
        let databasesRawList = databasesOutput.substring(databaseIndex + databaseIdText.length);
        databasesRawList = databasesRawList.replace(/[\r\n]+/g, "");
        databasesRawList = databasesRawList.replace(/[\s]+/g, ",");
        const databasesList = databasesRawList
            .split(",")
            .filter(x => x !== undefined && x !== null && x !== "")
            .map(x => x.trim());
        return databasesList;
    }
}
