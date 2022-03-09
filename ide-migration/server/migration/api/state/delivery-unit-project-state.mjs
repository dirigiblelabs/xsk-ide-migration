import { process } from "@dirigible/bpm";

export const deliveryUnitProjectStateStore = {
    saveState(deliveryUnitProjectState) {
        const execution = process.getExecutionContext();
        const deliveryUnitProjectKey = _createDeliveryUnitProjectKey(deliveryUnitProjectState.deliveryUnitName, deliveryUnitProjectState.projectName);
        const serializedDeliveryUnitProject = JSON.stringify(deliveryUnitProjectState);
        process.setVariable(execution.getId(), deliveryUnitProjectKey, serializedDeliveryUnitProject);
    },
    
    getState(deliveryUnitName, projectName) {
        const execution = process.getExecutionContext();
        const deliveryUnitProjectKey = _createDeliveryUnitProjectKey(deliveryUnitName, projectName);
        const serializedDeliveryUnitProject = process.getVariable(execution.getId(), deliveryUnitProjectKey);
        return JSON.parse(serializedDeliveryUnitProject);
    }
    
}

function _createDeliveryUnitProjectKey(deliveryUnitName, projectName) {
    return deliveryUnitName + "-" + projectName;
}


export class DeliveryUnitProjectState {
    constructor(deliveryUnitName, projectName) {
        this.deliveryUnitName = deliveryUnitName;
        this.projectName = projectName;
    }

}