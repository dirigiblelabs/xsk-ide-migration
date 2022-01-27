
let uploader = null;

migrationLaunchView.controller('ImportZippedDU', ['$scope', '$http', 'FileUploader', '$messageHub', function ($scope, $http, FileUploader, $messageHub) {

    $scope.TRANSPORT_PROJECT_URL = "/services/v4/transport/project";
    $scope.WORKSPACES_URL = "/services/v4/ide/workspaces";
    $scope.TEMP_MIGRATION_ROOT = "temp/migrations/";
    $scope.zipPaths = [];

    let url = $scope.WORKSPACES_URL;
    $http.get(url)
        .then(function (response) {
            let workspaceNames = response.data;
            $scope.workspaces = workspaceNames;
            if ($scope.workspaces[0]) {
                $scope.selectedWs = $scope.workspaces[0];
            }
        });
    $scope.projectFromZipPath = function (zipname = '') {
        return $scope.TEMP_MIGRATION_ROOT + $scope.selectedWs + "/" + zipname.split('.').slice(0, -1).join('.');
    }

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
        console.log('WS selected', $scope.selectedWs)
        // item.url = $scope.TRANSPORT_PROJECT_URL + "/" + $scope.selectedWs + '/' + item.file.name.split('.').slice(0, -1).join('-');
        item.url = $scope.TRANSPORT_PROJECT_URL + "?path=" + encodeURI($scope.projectFromZipPath(item.file.name));
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
    $scope.uploader.onRemove = function (fileItem) {
        console.log('REMOVE' + fileItem.file.name);
        return true;
    }
    $scope.uploader.onCancelItem = function (fileItem, response, status, headers) {
        console.log('CANCEL' + fileItem.file.name)
        //        console.info('onCancelItem', fileItem, response, status, headers);
    };
    $scope.uploader.onCompleteItem = function (fileItem, response, status, headers) {
        $scope.zipPaths.push($scope.projectFromZipPath(fileItem.file.name));
        //refreshFolder();
        // console.info('onCompleteItem', fileItem, response, status, headers);
    };
    $scope.uploader.onCompleteAll = function () {
        $scope.setFinishEnabled(true);
    };

}]);