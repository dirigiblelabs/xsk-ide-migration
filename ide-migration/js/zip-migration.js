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

let uploader = null;

migrationLaunchView.controller('ImportZippedDU', ['$scope', '$http', 'FileUploader', '$messageHub', function ($scope, $http, FileUploader, $messageHub) {

    $scope.TRANSPORT_PROJECT_URL = "/services/v4/transport/project";
    $scope.WORKSPACES_URL = "/services/v4/ide/workspaces";

    let url = $scope.WORKSPACES_URL;
    $http.get(url)
        .then(function (response) {
            let workspaceNames = response.data;
            $scope.workspaces = workspaceNames;
            if ($scope.workspaces[0]) {
                $scope.selectedWs = $scope.workspaces[0];
            }
        });


    // FILE UPLOADER

    $scope.uploader = uploader = new FileUploader({
        filters: [],
        url: $scope.TRANSPORT_PROJECT_URL
    });

    // UPLOADER FILTERS

    $scope.uploader.filters.push({
        name: 'customFilter',
        fn: function (item /*{File|FileLikeObject}*/, options) {
            return this.queue.length < 100;
        }
    });

    // UPLOADER CALLBACKS

    $scope.uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
        //        console.info('onWhenAddingFileFailed', item, filter, options);
    };
    $scope.uploader.onAfterAddingFile = function (fileItem) {

    };
    $scope.uploader.onAfterAddingAll = function (addedFileItems) {
        //        console.info('onAfterAddingAll', addedFileItems);
    };
   $scope.uploader.onBeforeUploadItem = function (item) {
        console.info('onBeforeUploadItem', item);

        // item.url = $scope.TRANSPORT_PROJECT_URL + "/" + $scope.selectedWs + '/' + item.file.name.split('.').slice(0, -1).join('-');
        $scope.selectedProject = item.file.name.split('.').slice(0, -1).join('-')
        item.url = $scope.TRANSPORT_PROJECT_URL + "?path=" + encodeURI('temp/migrations/' + $scope.selectedWs + '/' + $scope.selectedProject);

        body = {
            selectedWorkspace: $scope.selectedWs,
            zipPath: [item.url.split('=')[1]] 
        }

        console.log(JSON.stringify(body));
        $http.post(
            "/services/v4/js/ide-migration/server/migration/api/migration-rest-api.js/start-process-from-zip",
            body,
            { headers: { 'Content-Type': 'application/json' } }
        ).then(function (response) {
            console.log("RESPONsE"+ response);
        })

    };

    $scope.uploader.onProgressItem = function (fileItem, progress) {
        //        console.info('onProgressItem', fileItem, progress);
    };
    $scope.uploader.onProgressAll = function (progress) {
        //        console.info('onProgressAll', progress);
    };
    $scope.uploader.onSuccessItem = function (fileItem, response, status, headers) {
        //        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    $scope.uploader.onErrorItem = function (fileItem, response, status, headers) {
        //        console.info('onErrorItem', fileItem, response, status, headers);
        alert(response.err.message);
    };
    $scope.uploader.onCancelItem = function (fileItem, response, status, headers) {
        //        console.info('onCancelItem', fileItem, response, status, headers);
    };
    $scope.uploader.onCompleteItem = function (fileItem, response, status, headers) {
        $scope.setFinishEnabled(true);
        //refreshFolder();
        //        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    $scope.uploader.onCompleteAll = function () {
        $messageHub.message('workspace.refresh');
    };

}]);
