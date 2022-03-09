const XSKHDBCoreFacade = Java.type("com.sap.xsk.hdb.ds.facade.XSKHDBCoreSynchronizationFacade");
const hdbDDModel = "com.sap.xsk.hdb.ds.model.hdbdd.XSKDataStructureCdsModel";
const hdbTableFunctionModel = "com.sap.xsk.hdb.ds.model.hdbtablefunction.XSKDataStructureHDBTableFunctionModel";
const hdbCalculationViewModel = "migration.calc.view.model";

export class SynonymsGenerator {

    synonymFileName = "hdi-synonyms.hdbsynonym";
    publicSynonymFileName = "hdi-public-synonyms.hdbpublicsynonym";
    xskHdbCoreFacade = new XSKHDBCoreFacade();

    createSynonyms(file, content, workspaceCollection) {
        const fileName = this._getFileNameWithExtension(file);
        const filePath = this._getAbsoluteFilePath(file);
        const fileContent = bytes.byteArrayToText(content);

        // Parse current artifacts and generate synonym files for it if necessary
        const parsedData = this._parseArtifact(
            fileName,
            filePath,
            fileContent,
            workspaceCollection.getPath() + "/"
        );

        const synonymData = this._handleParsedData(parsedData);
        const hdbSynonyms = this._appendOrCreateSynonymsFile(this.synonymFileName, synonymData.hdbSynonyms, workspaceName, projectName);
        const hdbPublicSynonyms = this._appendOrCreateSynonymsFile(
            this.publicSynonymFileName,
            synonymData.hdbPublicSynonyms,
            workspaceName,
            projectName
        );

        return {
            hdbSynonyms,
            hdbPublicSynonyms
        }
    }

    _parseArtifact(fileName, filePath, fileContent, workspacePath) {
        if (isCalculationView(fileName)) {
            return this._buildCalcViewModel(fileName);
        }

        return xskHdbCoreFacade.parseDataStructureModel(
            fileName,
            filePath,
            fileContent,
            workspacePath
        );
    }

    _getFileNameWithExtension(file) {
        return file._name + "." + file._suffix;
    }

    _getAbsoluteFilePath(file) {
        const filePath = file._packageName.replaceAll(".", "/") + "/";
        return filePath + this._getFileNameWithExtension(file);
    }

    _handleParsedData(parsedData) {
        if (!parsedData) {
            return [];
        }

        const dataModelType = parsedData.getClass().getName();

        var synonyms = [];
        var publicSynonyms = [];
        if (dataModelType == hdbDDModel) {
            for (const tableModel of parsedData.tableModels) {
                const tableModelName = tableModel.getName();
                const tableModelSchema = tableModel.getSchema();
                const hdbSynonym = this._generateHdbSynonym(
                    tableModelName,
                    tableModelSchema
                );

                synonyms.push(hdbSynonym);
            }

            for (const tableTypeModel of parsedData.tableTypeModels) {
                const tableTypeModelName = tableTypeModel.getName();
                const tableTypeModelSchema = tableTypeModel.getSchema();
                const hdbSynonym = this._generateHdbSynonym(
                    tableTypeModelName,
                    tableTypeModelSchema
                );

                synonyms.push(hdbSynonym);
            }
        } else {
            const modelName = parsedData.getName();

            if (dataModelType == hdbTableFunctionModel || dataModelType == hdbCalculationViewModel) {
                const hdbPublicSynonym = this._generateHdbPublicSynonym(modelName);
                publicSynonyms.push(hdbPublicSynonym);
            }
            else {
                const modelSchema = parsedData.getSchema();
                const hdbSynonym = this._generateHdbSynonym(modelName, modelSchema);
                synonyms.push(hdbSynonym);
            }
        }

        return { hdbSynonyms: synonyms, hdbPublicSynonyms: publicSynonyms };
    }

    _buildCalcViewModel(fileName) {
        const calcViewName = fileName.substring(0, fileName.lastIndexOf('.'));
        const calcViewModelClass = {
            getName: () => hdbCalculationViewModel
        }
        const calcViewModel = {
            getName: () => calcViewName,
            getClass: () => calcViewModelClass
        }
        return calcViewModel;
    }

    _generateHdbSynonym(name, schemaName) {
        const trimmedName = name.split(":").pop();
        return {
            name: name,
            value: {
                target: {
                    object: trimmedName,
                    schema: schemaName,
                },
            },
        };
    }

    _generateHdbPublicSynonym(name) {
        return {
            name: name,
            value: {
                target: {
                    object: name,
                },
            },
        };
    }

    _appendOrCreateSynonymsFile(fileName, synonyms, workspaceName, projectName) {
        const synonymLocalPaths = [];

        if (!synonyms) {
            return synonymLocalPaths;
        }

        for (const synonym of synonyms) {
            const synonymResourceAndPaths = this._getOrCreateHdbSynonymFile(workspaceName, projectName, fileName);
            const synonymFile = synonymResourceAndPaths.resource;
            if (synonymResourceAndPaths.localPaths) {
                synonymLocalPaths.push(synonymResourceAndPaths.localPaths);
            }

            const synonymFileContent = synonymFile.getContent();
            const synonymFileContentAsText = bytes.byteArrayToText(synonymFileContent);
            const content = JSON.parse(synonymFileContentAsText);

            content[synonym.name] = synonym.value;

            const newSynonymFileContent = JSON.stringify(content, null, 4);
            const newSynonymFileBytes = bytes.textToByteArray(newSynonymFileContent);

            synonymFile.setContent(newSynonymFileBytes);
        }

        return synonymLocalPaths;
    }

    _getOrCreateHdbSynonymFile(workspaceName, projectName, hdbSynonymFileName) {
        const workspaceCollection = repositoryManager.getCollection(workspaceName);
        const projectCollection = workspaceCollection.getCollection(projectName);

        var synonymFile = projectCollection.getResource(hdbSynonymFileName);
        if (synonymFile.exists()) {
            return {
                resource: synonymFile,
                localPaths: null,
            };
        }

        synonymFile = projectCollection.createResource(hdbSynonymFileName, bytes.textToByteArray("{}"));
        return {
            resource: synonymFile,
            localPaths: {
                repositoryPath: synonymFile.getPath(),
                relativePath: synonymFile.getPath().split(projectName).pop(),
                projectName: projectName,
                runLocation: synonymFile.getPath().split(workspaceName).pop(),
            },
        };
    }
}