import { workspace as workspaceManager, repository as repositoryManager } from "@dirigible/platform";

export function getOrCreateTemporaryWorkspaceCollection(workspaceName) {
    const existing = repositoryManager.getCollection(workspaceName);
    if (existing) {
        if (!existing.exists()) {
            existing.create();
        }
        return existing;
    }

    return repositoryManager.createCollection(workspaceName);
}

export function getOrCreateTemporaryProjectCollection(workspaceCollection, projectName) {
    const existing = workspaceCollection.getCollection(projectName);
    if (existing) {
        if (!existing.exists()) {
            existing.create();
        }
        return existing;
    }

    return workspaceCollection.createCollection(projectName);
}