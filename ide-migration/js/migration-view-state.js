migrationLaunchView.factory("migrationViewState", ["migrationFlow", function (migrationFlow) {
    let isDataLoading = false;
    let nextDisabled = true;
    let finishVisible = false;
    let nextVisible = true;
    let fullWidthEnabled = false;

    function isFullWidthEnabled() {
        return fullWidthEnabled;
    }

    function setFullWidthEnabled(enabled) {
        fullWidthEnabled = enabled;
    }

    function isBottomNavHidden() {
        return migrationFlow.getCurrentStepIndex() === 0 || getIsDataLoading() || migrationFlow.getCurrentStepIndex() === 5 || migrationFlow.getCurrentStepIndex() === 4;
    }

    function isPreviousDisabled() {
        return getIsDataLoading();
    }

    function isPreviousVisible() {
        return !getIsDataLoading() && migrationFlow.getCurrentStepIndex() > 0;
    }

    function isNextDisabled() {
        return nextDisabled;
    }

    function isNextVisible() {
        return nextVisible;
    }

    function setNextVisible(visible) {
        nextVisible = visible;
    }

    function isFinishDisabled() {
        return !getIsDataLoading();
    }

    function isFinishVisible() {
        return finishVisible;
    }

    function setFinishVisible(visible) {
        finishVisible = visible;
    }

    function isOnStatisticsPage() {
        return migrationFlow.getCurrentStepIndex() === 0;
    }

    function setNextDisabled(disabled) {
        nextDisabled = disabled;
    }

    function getVisibleStep() {
        if (migrationFlow.getActiveFlow() === FLOW_TYPE_LIVE) {
            switch (migrationFlow.getCurrentStepIndex()) {
                case 1:
                    return 'neo-credentials';

                case 2:
                    return 'hana-credentials';

                case 3:
                    return 'delivery-unit';

                case 4:
                    return 'changes';

                case 5:
                    return 'start-migration';

                default:
                    throw ("Step does not exist in flow");

            }
        }

        if (migrationFlow.getActiveFlow() === FLOW_TYPE_ZIP) {
            switch (migrationFlow.getCurrentStepIndex()) {
                case 1:
                    return 'zip-migration';

                case 2:
                    return 'start-migration';

                default:
                    throw ("Step does not exist in flow");
            }
        }
    }

    function setDataLoading(loading) {
        isDataLoading = loading;
    }

    function getIsDataLoading() {
        return isDataLoading;
    }

    return {
        isFullWidthEnabled,
        isBottomNavHidden,
        isPreviousDisabled,
        isPreviousVisible,
        isNextDisabled,
        isNextVisible,
        isFinishDisabled,
        isFinishVisible,
        isOnStatisticsPage,
        setFinishVisible,
        setNextVisible,
        getVisibleStep,
        setFullWidthEnabled,
        setNextDisabled,
        setDataLoading,
        getIsDataLoading
    };
}]);