migrationLaunchView.factory("$messageHub", [
    function () {
        var messageHub = new FramesMessageHub();
        var announceAlert = function (title, message, type) {
            messageHub.post(
                {
                    data: {
                        title: title,
                        message: message,
                        type: type,
                    },
                },
                "ide.alert"
            );
        };
        var announceAlertError = function (title, message) {
            announceAlert(title, message, "error");
        };
        var message = function (evtName, data) {
            messageHub.post({ data: data }, evtName);
        };
        var on = function (topic, callback) {
            messageHub.subscribe(callback, topic);
        };
        return {
            openNext: null,
            openState: null
        };



    },
]);