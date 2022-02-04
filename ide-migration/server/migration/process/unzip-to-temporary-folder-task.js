/*
 * Copyright (c) 2022 SAP SE or an SAP affiliate company and XSK contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Apache License, v2.0
 * which accompanies this distribution, and is available at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and XSK contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const process = require('bpm/v4/process');
const repositoryManager = require("platform/v4/repository");
const execution = process.getExecutionContext();
const MigrationService = require('ide-migration/server/migration/api/migration-service');
const TrackService = require('ide-migration/server/migration/api/track-service');
const trackService = new TrackService();

try {

	trackService.addEntry("PROCESSING ZIP")
	process.setVariable(execution.getId(), 'migrationState', 'FROM_LOCAL_ZIP');
	process.setVariable(execution.getId(), 'migrationIndex', trackService.getCurrentMigrationIndex());
	const userDataJson = process.getVariable(execution.getId(), 'userData');
	const userData = JSON.parse(userDataJson);
	userData["du"] = [];
	let paths = userData.zipPath;
	userData.workspace = userData.selectedWorkspace;


	for (path of paths) {
		let details = [];
		let locals = []
		console.log("Processing zip by path : " + path)
		let resources = repositoryManager.getCollection(path);
		var zipProjectName = resources.getName();
		getAllFiles(resources);

		function getAllFiles(resources) {
			getResourcesFromFOlder(resources)
		}


		function getResourcesFromFOlder(dir) {
			if (!dir.getResourcesNames().isEmpty()) {
				for (nameRes of dir.getResourcesNames()) {
					locals.push(dir.getResource(nameRes))
				}
			}
			if (!dir.getCollectionsNames().isEmpty()) {
				for (abs of dir.getCollectionsNames()) {
					getResourcesFromFOlder(dir.getCollection(abs))
				}
			}
		}

		for (loc of locals) {
			const repositoryPath = loc.getPath();
			const withoutRootFolder = repositoryPath
				.substring(repositoryPath.indexOf("/") + 1, repositoryPath.length);
			const withoutMigrationsFolder = withoutRootFolder
				.substring(withoutRootFolder.indexOf("/") + 1, withoutRootFolder.length);
			const withoutNestedFolder = withoutMigrationsFolder
				.substring(withoutMigrationsFolder.indexOf("/") + 1, withoutMigrationsFolder.length);
			const runLocation = withoutNestedFolder
				.substring(withoutNestedFolder.indexOf("/") + 1, withoutNestedFolder.length);
			const relativePath = runLocation
				.substring(runLocation.indexOf("/") + 1, runLocation.length);

			temp = {
				repositoryPath: repositoryPath,
				relativePath: "/" + relativePath,
				projectName: zipProjectName,
				runLocation: "/" + runLocation
			};

			details.push(temp)
		}

		userData.du.push(composeJson(zipProjectName, details))
	}
	process.setVariable(execution.getId(), 'userData', JSON.stringify(userData));
	trackService.updateMigrationStatus('PROCESSING ZIP DONE');
} catch (e) {
	console.log(e.message);
	process.setVariable(execution.getId(), 'migrationState', 'PROCESSING ZIP FAILED');
	trackService.updateMigrationStatus('PROCESSING ZIP FAILED');
	process.setVariable(execution.getId(), 'PROCESSING ZIP FAILED', e.toString());
}

function composeJson(projectName, locals) {
	let duObject = {}
	duObject.ach = "";
	duObject.caption = "";
	duObject.lastUpdate = getFormattedDate()
	duObject.ppmsID = "";
	duObject.responsible = "";
	duObject.sp_PPMS_ID = "";
	duObject.vendor = "migration.sap.com";
	duObject.version = "";
	duObject.version_patch = "";
	duObject.version_sp = "";
	duObject.name = projectName
	duObject.locals = locals;
	return duObject;
}

function getFormattedDate() {

	var date = new Date();
	var dateStr = date.getFullYear() + "-" +
		("00" + (date.getMonth() + 1)).slice(-2) + "-" +
		("00" + date.getDate()).slice(-2) + " " +
		("00" + date.getHours()).slice(-2) + ":" +
		("00" + date.getMinutes()).slice(-2) + ":" +
		("00" + date.getSeconds()).slice(-2);
	return dateStr
}
