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
    $scope.showDropdownList = false;
    $scope.duDropdownText = "---Please select---";
    $scope.deliveryUnits = ["DU1", "DU2", "DU3", "DU4", "DU5", "DU6", "DU7", "FO1", "LO2"];
    $scope.deliveryUnitList = $scope.deliveryUnits;
    $scope.duLoaded = false;
    let selectedDeliveyUnit = undefined;
    let descriptionList = [
        "Please wait while we get all delivery units...",
        "Provide the target delivery unit"
    ];
    $scope.descriptionText = descriptionList[0];

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    $scope.dropdownClick = function () {
        $scope.showDropdownList = !$scope.showDropdownList;
    };

    $scope.filterFunction = function () {
        if ($scope.dropdownSearch) {
            let filtered = [];
            for (let i = 0; i < $scope.deliveryUnits.length; i++) {
                if ($scope.deliveryUnits[i].toLowerCase().includes($scope.dropdownSearch.toLowerCase())) {
                    filtered.push($scope.deliveryUnits[i]);
                }
            }
            $scope.deliveryUnitList = filtered;
        } else {
            $scope.deliveryUnitList = $scope.deliveryUnits;
        }
    }

    $scope.duSelected = function (deliveryUnit) {
        selectedDeliveyUnit = deliveryUnit;
        $scope.duDropdownText = deliveryUnit;
        $scope.$parent.setFinishEnabled(true);
    };

    $messageHub.on('migration.delivery-unit', function (msg) {
        if ("isVisible" in msg.data) {
            $scope.$apply(function () {
                $scope.duLoaded = false;
                $scope.descriptionText = descriptionList[0];
                $scope.isVisible = msg.data.isVisible;
                if (msg.data.isVisible) {
                    if (selectedDeliveyUnit) {
                        $scope.$parent.setFinishEnabled(true);
                    } else {
                        $scope.$parent.setFinishEnabled(false);
                    }
                    $scope.$parent.setBottomNavEnabled(false);
                    $scope.$parent.setPreviousVisible(true);
                    $scope.$parent.setPreviousEnabled(true);
                    $scope.$parent.setNextVisible(false);
                    $scope.$parent.setFinishVisible(true);
                }
            });
            if (msg.data.isVisible) {
                sleep(4000).then(() => {
                    $scope.$apply(function () {
                        $scope.duLoaded = true;
                        $scope.descriptionText = descriptionList[1];
                        $scope.$parent.setBottomNavEnabled(true);
                    });
                });
            }
        }
    }.bind(this));
}]);