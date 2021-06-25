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
migrationLaunchView.controller('NeoCredentialsViewController', ['$scope', '$messageHub', function ($scope, $messageHub) {
    $scope.isVisible = true;
    $scope.passwordVisible = false;

    $scope.userInput = function () {
        if ($scope.hostName && $scope.subaccount && $scope.username && $scope.password) {
            $scope.$parent.setNextEnabled(true);
        } else {
            $scope.$parent.setNextEnabled(false);
        };
    };

    $scope.showPassword = function () {
        $scope.passwordVisible = !$scope.passwordVisible;
    };

    $messageHub.on('migration.neo-credentials', function (msg) {
        if ("isVisible" in msg.data) {
            $scope.$apply(function () {
                $scope.isVisible = msg.data.isVisible;
                if (msg.data.isVisible) {
                    $scope.userInput();
                    $scope.$parent.setPreviousVisible(false);
                    $scope.$parent.setPreviousEnabled(true);
                    $scope.$parent.setNextVisible(true);
                    $scope.$parent.setFinishVisible(false);
                }
            });
        }
        if ("getData" in msg.data) {
            if (msg.data.getData === "all") {
                $messageHub.message(msg.data.controller, {
                    neoData: {
                        "hostName": $scope.hostName,
                        "subaccount": $scope.subaccount,
                        "username": $scope.username,
                        "password": $scope.password
                    }
                });
            }
        }
    }.bind(this));
}]);