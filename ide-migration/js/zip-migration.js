
let uploader = null;
angular
    .module('migration', ['angularFileUpload'])
    .factory('httpRequestInterceptor', function () {
        let csrfToken = null;
        return {
            request: function (config) {
                config.headers['X-Requested-With'] = 'Fetch';
                config.headers['X-CSRF-Token'] = csrfToken ? csrfToken : 'Fetch';
                return config;
            },
            response: function (response) {
                let token = response.headers()['x-csrf-token'];
                if (token) {
                    csrfToken = token;
                    uploader.headers['X-CSRF-Token'] = csrfToken;
                }
                return response;
            }
        };
    })
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('httpRequestInterceptor');
    }])
    .factory('$messageHub', [function () {
        let messageHub = new FramesMessageHub();
        let message = function (evtName, evtData) {
            messageHub.post({ data: evtData }, evtName);
        };
        let on = function (topic, callback) {
            messageHub.subscribe(callback, topic);
        };
        return {
            message: message,
            on: on
        };
    }]);


migrationLaunchView.controller('ImportZippedDU', ['$scope', '$http', 'FileUploader', '$messageHub', function ($scope, $http, FileUploader, $messageHub) {

    $scope.TRANSPORT_PROJECT_URL = "/services/v4/transport/project";

    // FILE UPLOADER

    $scope.uploader = new FileUploader({
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
        //        console.info('onBeforeUploadItem', item);
        item.url = $scope.TRANSPORT_PROJECT_URL + "/" + $scope.selectedWs;
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
        //refreshFolder();
        //        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    $scope.uploader.onCompleteAll = function () {
        $messageHub.message('workspace.refresh');
    };

}]);