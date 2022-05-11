const FLOW_TYPE_ZIP = 1;
const FLOW_TYPE_LIVE = 2;

migrationLaunchView.factory("stepFactory", ['migrationViewState', 'migrationFlow', function (migrationViewState, migrationFlow) {
    const steps = [
        {
            id: 1,
            name: "SAP BTP Neo Credentials",
            topicId: "migration.neo-credentials"
        },
        {
            id: 2,
            name: "SAP HANA Credentials",
            topicId: "migration.hana-credentials",
            onLoad: "migration.get-databases"
        },
        { id: 3, name: "Delivery Units", topicId: "migration.delivery-unit", onLoad: "migration.delivery-unit" },
        { id: 4, name: "Changes", topicId: "migration.changes", onLoad: "migration.changes" },
        { id: 5, name: "Migration", topicId: "migration.start-migration", onLoad: "migration.start-migration" },
    ];

    const zipsteps = [
        { id: 1, name: "Upload ZIP file", topicId: "migration.upload-zip-migration" },
        { id: 2, name: "Migration", topicId: "migration.start-zip-migration" },
    ];

    function getStepByIndex(index) {
        const activeFlow = migrationFlow.getActiveFlow();
        return activeFlow === FLOW_TYPE_LIVE ? steps[index - 1] : zipsteps[index - 1]; //TODO: refactor - get by id instead index in array
    }

    function getStepByIndexForFlow(index, flow) {
        return flow === FLOW_TYPE_LIVE ? steps[index - 1] : zipsteps[index - 1];
    }

    function getSteps() {
        const activeFlow = migrationFlow.getActiveFlow();
        return activeFlow === FLOW_TYPE_LIVE ? steps : zipsteps;
    }

    return {
        getStepByIndex,
        getSteps,
        getStepByIndexForFlow
    }
}])