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
var migrationLaunchView = angular.module('migration-launch', []);

migrationLaunchView.factory('$messageHub', [function () {
    var messageHub = new FramesMessageHub();
    var message = function (evtName, data) {
        messageHub.post({ data: data }, evtName);
    };
    var on = function (topic, callback) {
        messageHub.subscribe(callback, topic);
    };
    return {
        message: message,
        on: on
    };
}]);

migrationLaunchView.controller('MigrationLaunchViewController', ['$scope', '$messageHub', function ($scope, $messageHub) {
    $scope.steps = [
        { id: 1, name: "Delivery Unit" },
        { id: 2, name: "NEO DB Tunnel Credentials" },
        { id: 3, name: "SAP HANA Credentials" }
    ];
    $scope.currentStep = $scope.steps[0];

    $scope.isStepActive = function (stepId) {
        if (stepId == $scope.currentStep.id)
            return "active";
        else if (stepId < $scope.currentStep.id)
            return "done"
        else
            return "inactive";
    }

    $scope.goToStep = function (stepId) {
        console.log(stepId);
    }

    $messageHub.on('migration.launch', function (msg) {
    }.bind(this));
}]);