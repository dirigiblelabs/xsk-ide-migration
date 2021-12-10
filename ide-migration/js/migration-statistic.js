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
var migrationStatisticView = angular.module('migration-statistic', []);

migrationStatisticView.factory('$messageHub', [
	function() {
		var messageHub = new FramesMessageHub();
		var announceAlert = function(title, message, type) {
			messageHub.post(
				{
					data: {
						title: title,
						message: message,
						type: type
					}
				},
				'ide.alert'
			);
		};
		var announceAlertError = function(title, message) {
			announceAlert(title, message, 'error');
		};
		var message = function(evtName, data) {
			messageHub.post({ data: data }, evtName);
		};
		var on = function(topic, callback) {
			messageHub.subscribe(callback, topic);
		};
		return {
			announceAlert: announceAlert,
			announceAlertError: announceAlertError,
			message: message,
			on: on
		};
	}
]);

migrationStatisticView.controller('MigrationStatisticsController', [
	'$scope',
	'$http',
	'$interval',
	function($scope, $http, $interval) {
		let body = { migrations: 'empty' };
		$scope.text = 'XSK Migration Statistic';
		populateData();
		$interval(populateData, 5000);

		function populateData() {
			$http
				.post(
					'/services/v4/js/ide-migration/server/migration/api/migration-rest-api.js/migrationsTrack',
					JSON.stringify(body),
					{ headers: { 'Content-Type': 'application/json' } }
				)
				.then(
					function(response) {
						$scope.migrations = JSON.parse(JSON.stringify(response.data));
						$scope.showTable = $scope.migrations === 'empty';
					},
					function(response) {
						if (response.data && response.data.failed) {
						}
					}
				);
		}
	}
]);
