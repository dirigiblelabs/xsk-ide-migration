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
migrationLaunchView.controller('DeliveryUnitViewController', ['$scope', '$messageHub', function ($scope, $messageHub) {
    $scope.isVisible = false;
    $scope.deliveryUnitList = ["DU1", "DU2", "DU3", "DU4", "DU5", "DU6", "DU7"];
    let selectedDeliveyUnit = undefined;

    $scope.duSelected = function (deliveryUnit) {
        selectedDeliveyUnit = deliveryUnit;
        $scope.$parent.setFinishEnabled(true);
    };

    $scope.duUnselected = function () {
        selectedDeliveyUnit = undefined;
        $scope.$parent.setFinishEnabled(false);
    };

    $messageHub.on('migration.delivery-unit', function (msg) {
        if ("isVisible" in msg.data) {
            $scope.$apply(function () {
                $scope.isVisible = msg.data.isVisible;
                if (selectedDeliveyUnit) {
                    $scope.$parent.setFinishEnabled(true);
                } else {
                    $scope.$parent.setFinishEnabled(false);
                }
                $scope.$parent.setPreviousVisible(true);
                $scope.$parent.setPreviousEnabled(true);
                $scope.$parent.setNextVisible(false);
                $scope.$parent.setFinishVisible(true);
            });
        }
    }.bind(this));
}]);