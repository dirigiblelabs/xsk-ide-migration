migrationLaunchView.factory("migrationFlow", ["$messageHub", function ($messageHub) {
    let currentStepIndex = 0;

    let activeFlow = null;

    function setActiveFlow(type) {
        activeFlow = type;
    }

    function getActiveFlow() {
        return activeFlow;
    }

    function goForward() {
        currentStepIndex++;
    }

    function goBack() {
        currentStepIndex--;
    }

    function goToStep(index, flowType, step, data) {
        currentStepIndex = index;
        activeFlow = flowType;
        $messageHub.message(step.onLoad, data);
    }

    function getCurrentStepIndex() {
        return currentStepIndex;
    }

    return {
        setActiveFlow,
        getActiveFlow,
        goForward,
        goBack,
        goToStep,
        getCurrentStepIndex,
    }

}]);
