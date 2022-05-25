migrationLaunchView.factory("$messageHub", [
    function () {
        const messageHub = new FramesMessageHub();
        const announceAlert = function (title, message, type) {
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
        const announceAlertError = function (title, message) {
            announceAlert(title, message, "error");
        };
        const message = function (evtName, data) {
            messageHub.post({ data: data }, evtName);
        };
        const on = function (topic, callback) {
            messageHub.subscribe(callback, topic);
        };
        return {
            openNext: null,
            openState: null
        };



    },
]);