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
migrationLaunchView.controller('StartMigrationViewController', ['$scope', '$http', '$messageHub', 'migrationDataState', function ($scope, $http, $messageHub, migrationDataState) {
    $scope.migrationDataState = migrationDataState;
    $scope.isVisible = false;
    $scope.migrationFinished = false;
    $scope.progressBarPercentage = 100;
    let titleList = [
        "Migration in progress",
        "Migration complete"
    ]
    $scope.progressTitle = titleList[0];
    $scope.statusMessage = "Configuration processing...";
    let defaultErrorTitle = "Error migrating project";
    let defaultErrorDesc = "Please check if the information you provided is correct and try again.";

    function startMigration(duData) {
        body = {
            neo: {
                hostName: migrationDataState.neoHostName,
                subaccount: migrationDataState.neoSubaccount,
            },
            hana: {
                databaseSchema: migrationDataState.schemaName,
                username: migrationDataState.dbUsername,
                password: migrationDataState.dbPassword
            },
            connectionId: migrationDataState.connectionId,
            workspace: migrationDataState.selectedWorkspace,
            du: {
                name: migrationDataState.selectedDeliveryUnit.name,
                vendor: migrationDataState.selectedDeliveryUnit.vendor
            },
            processInstanceId: migrationDataState.processInstanceId
        };
        $http.post(
            "/services/v4/js/ide-migration/server/migration/api/migration-rest-api.js/continue-process",
            JSON.stringify(body),
            { headers: { 'Content-Type': 'application/json' } }
        ).then(function (response) {
            $scope.progressTitle = titleList[1];
            $scope.statusMessage = `Project was successfully created.`;
            $scope.migrationFinished = true;
        }, function (response) {
            if (response.data) {
                if ("error" in response.data) {
                    if ("message" in response.data.error) {
                        $messageHub.announceAlertError(
                            defaultErrorTitle,
                            response.data.error.message
                        );
                    } else {
                        $messageHub.announceAlertError(
                            defaultErrorTitle,
                            defaultErrorDesc
                        );
                    }
                    console.error(`HTTP $response.status`, response.data.error);
                } else {
                    $messageHub.announceAlertError(
                        defaultErrorTitle,
                        defaultErrorDesc
                    );
                }
            } else {
                $messageHub.announceAlertError(
                    defaultErrorTitle,
                    defaultErrorDesc
                );
            }
            errorOccurred();
        });
    };

    function errorOccurred() {
        $scope.$parent.previousClicked();
    }

    $scope.goToWorkspace = function () {
        $messageHub.message(
            "workspace.set",
            {
                workspace: migrationDataState.selectedWorkspace
            }
        );
        $messageHub.message(
            "ide-core.openPerspective",
            {
                link: "../ide/index.html"
            }
        );
    };

    $messageHub.on('migration.start-migration', function (msg) {
        if ("isVisible" in msg.data) {
            $scope.$apply(function () {
                $scope.isVisible = msg.data.isVisible;
            });
            if (msg.data.isVisible) {
                startMigration();
            }
        }
    }.bind(this));
}]);