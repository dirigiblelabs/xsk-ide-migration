/*
 * Copyright (c) 2010-2021 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2010-2021 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
migrationLaunchView.controller('StartMigrationViewController', ['$scope', '$http', '$messageHub', function ($scope, $http, $messageHub) {
    $scope.isVisible = false;
    $scope.migrationFinished = false;
    $scope.progressBarPercentage = 100;
    let titleList = [
        "Configuration processing, starting the migration...",
        "Migration complete"
    ]
    $scope.progressTitle = titleList[0];
    let neoData = undefined;
    let hanaData = undefined;

    function startMigration(duData) {
        body = {
            neo: neoData,
            hana: hanaData,
            "connectionId": duData.connectionId,
            "workspace": duData.workspace,
            "vendor": duData.du.vendor,
            "du": duData.du.name,
        }
        $http.post(
            "/public/v4/migration-operations/execute-migration",
            JSON.stringify(body),
            { headers: { 'Content-Type': 'application/json' } }
        ).then(function (response) {
            if (response.status == 201) {
                $scope.migrationFinished = true;
                $scope.progressTitle = titleList[1];
                console.log(response.data);
            }
        });
    };

    $scope.migrationDone = function () {
        $scope.migrationFinished = true;
    };

    $messageHub.on('migration.start-migration', function (msg) {
        if ("isVisible" in msg.data) {
            $scope.$apply(function () {
                $scope.isVisible = msg.data.isVisible;
            });
            if (msg.data.isVisible) {
                $messageHub.message('migration.neo-credentials', { controller: "migration.start-migration", getData: "all" });
                $messageHub.message('migration.hana-credentials', { controller: "migration.start-migration", getData: "all" });
                $messageHub.message('migration.delivery-unit', { controller: "migration.start-migration", getData: "all" });
            }
        }
        if ("neoData" in msg.data) {
            neoData = msg.data.neoData;
        }
        if ("hanaData" in msg.data) {
            hanaData = msg.data.hanaData;
        }
        if ("duData" in msg.data) {
            startMigration(msg.data.duData);
        }
    }.bind(this));
}]);