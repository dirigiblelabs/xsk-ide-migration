/*
 * Copyright (c) 2021 SAP SE or an SAP affiliate company and XSK contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Apache License, v2.0
 * which accompanies this distribution, and is available at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-FileCopyrightText: 2021 SAP SE or an SAP affiliate company and XSK contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const HanaRepository = require('ide-migration/server/migration/repository/hana-repository');
const workspaceManager = require("platform/v4/workspace");
const repositoryManager = require("platform/v4/repository");
const bytes = require("io/v4/bytes");
const database = require("db/v4/database");
const config = require("core/v4/configurations");
const HANA_USERNAME = "HANA_USERNAME";
const TransformerFactory = Java.type("javax.xml.transform.TransformerFactory");
const StreamSource = Java.type("javax.xml.transform.stream.StreamSource");
const StreamResult = Java.type("javax.xml.transform.stream.StreamResult")
const StringReader = Java.type("java.io.StringReader")
const StringWriter = Java.type("java.io.StringWriter")

class MigrationService {

    connection = null;
    repo = null;

    setupConnection(databaseName, databaseUser, databaseUserPassword, connectionUrl) {
        database.createDataSource(databaseName, "com.sap.db.jdbc.Driver", connectionUrl, databaseUser, databaseUserPassword, null);

        this.connection = database.getConnection('dynamic', databaseName);
        this.repo = new HanaRepository(this.connection);
    }

    getAllDeliveryUnits() {
        if (!this.repo) {
            throw new Error("Repository not initialized");
        }

        return this.repo.getAllDeliveryUnits();
    }

    copyAllFilesForDu(du, workspaceName) {
        if (!this.repo) {
            throw new Error("Repository not initialized");
        }

        let context = {};
        const filesAndPackagesObject = this.repo.getAllFilesForDu(context, du)
        this.dumpSourceFiles(workspaceName, filesAndPackagesObject.files, du)
    }

    dumpSourceFiles(workspaceName, lists, du) {
        let workspace;
        if (!workspaceName) {
            workspace = workspaceManager.getWorkspace(du.name)
            if (!workspace) {
                workspaceManager.createWorkspace(du.name)
                workspace = workspaceManager.getWorkspace(du.name)
            }
        }
        workspace = workspaceManager.getWorkspace(workspaceName);

        const deployables = [];

        for (let i = 0; i < lists.length; i++) {
            const file = lists[i];
            // each file's package id is based on its directory
            // if we do not get only the first part of the package id, we would have several XSK projects created for directories in the same XS app
            const projectName = file.packageId.split('.')[0];

            let project = workspace.getProject(projectName)
            if (!project) {
                workspace.createProject(projectName)
                project = workspace.getProject(projectName)
            }

            if (!deployables.find(x => x.projectName === projectName)) {
                deployables.push({
                    project: project,
                    projectName: projectName,
                    artifacts: []
                });
            }

            let fileRunLocation = file.RunLocation;

            if (fileRunLocation.startsWith("/" + projectName)) {
                // remove package id from file location in order to remove XSK project and folder nesting
                fileRunLocation = fileRunLocation.slice(projectName.length + 1);
            }

            if (fileRunLocation.endsWith('hdbcalculationview')
                || fileRunLocation.endsWith('calculationview')) {
                file._content = this.transformPrivileges(file._content);
                file._content = this.transformColumnObject(file._content);
                deployables.find(x => x.projectName === projectName).artifacts.push(file.RunLocation);
            }

            let projectFile = project.createFile(fileRunLocation);
            projectFile.setContent(file._content);
        }

        this.handlePossibleDeployableArtifacts(deployables);
    }

    handlePossibleDeployableArtifacts(deployables) {
        for (const deployable of deployables) {
            if (deployable.artifacts && deployable.artifacts.length > 0) {
                const hdiConfigPath = this.createHdiConfigFile(deployable.project);
                this.createHdiFile(deployable.project, hdiConfigPath, deployable.artifacts);
            }
        }
    }

    createHdiConfigFile(project) {
        const hdiConfig = {
            file_suffixes: {
                hdbcalculationview: {
                    plugin_name: "com.sap.hana.di.calculationview",
                    plugin_version: "12.1.0"
                },
                calculationview: {
                    plugin_name: "com.sap.hana.di.calculationview",
                    plugin_version: "12.1.0"
                }
            }
        };

        const projectName = project.getName();
        const hdiConfigPath = `${projectName}.hdiconfig`;
        const hdiConfigFile = project.createFile(hdiConfigPath);
        const hdiConfigJson = JSON.stringify(hdiConfig, null, 4);
        const hdiConfigJsonBytes = bytes.textToByteArray(hdiConfigJson);
        hdiConfigFile.setContent(hdiConfigJsonBytes);

        return hdiConfigPath;
    }

    createHdiFile(project, hdiConfigPath, deployables) {
        const projectName = project.getName();
        const defaultHanaUser = this.getDefaultHanaUser();

        const hdi = {
            configuration: `/${projectName}/${hdiConfigPath}`,
            users: [defaultHanaUser],
            group: projectName,
            container: projectName,
            deploy: deployables,
            undeploy: []
        };

        const hdiPath = `${projectName}.hdi`;
        const hdiFile = project.createFile(`${projectName}.hdi`);
        const hdiJson = JSON.stringify(hdi, null, 4);
        const hdiJsonBytes = bytes.textToByteArray(hdiJson);
        hdiFile.setContent(hdiJsonBytes);

        return hdiPath;
    }

    getDefaultHanaUser() {
        return config.get(HANA_USERNAME, "DBADMIN");
    }

    copyFilesLocally(workspaceName, lists) {
        let collection = repositoryManager.createCollection(workspaceName);

        let locals = [];
        for (let i = 0; i < lists.length; i++) {
            const file = lists[i];
            let fileRunLocation = file.RunLocation;

            // each file's package id is based on its directory
            // if we do not get only the first part of the package id, we would have several XSK projects created for directories in the same XS app
            const projectName = file.packageId.split('.')[0];

            if (fileRunLocation.startsWith("/" + projectName)) {
                // remove package id from file location in order to remove XSK project and folder nesting
                fileRunLocation = fileRunLocation.slice(projectName.length + 1);
            }
            let content = this.repo.getContentForObject(file._name, file._packageName, file._suffix);
            let copiedFile = collection.createResource(fileRunLocation, content);
            locals.push({ path: copiedFile.getPath(), projectName, runLocation: file.RunLocation })
        }
        return locals;
    }

    createMigratedWorkspace(workspaceName, du) {
        let workspace;
        if (!workspaceName) {
            workspace = workspaceManager.getWorkspace(du.name)
            if (!workspace) {
                workspaceManager.createWorkspace(du.name)
                workspace = workspaceManager.getWorkspace(du.name)
            }
        }
        workspace = workspaceManager.getWorkspace(workspaceName);

        return workspace;
    }

    collectDeployables(workspaceName, filePath, runLocation, projectName, oldDeployables) {

        let workspace = workspaceManager.getWorkspace(workspaceName)
        if (!workspace) {
            workspaceManager.createWorkspace(workspaceName)
            workspace = workspaceManager.getWorkspace(workspaceName)
        }

        const deployables = oldDeployables;

        let project = workspace.getProject(projectName)
        if (!project) {
            workspace.createProject(projectName)
            project = workspace.getProject(projectName)
        }

        if (!deployables.find(x => x.projectName === projectName)) {
            deployables.push({
                project: project,
                projectName: projectName,
                artifacts: []
            });
        }

        if (filePath.endsWith('hdbcalculationview')
            || filePath.endsWith('calculationview')) {
            deployables.find(x => x.projectName === projectName).artifacts.push(runLocation);
        }

        return deployables;
    }

    addFileToWorkspace(workspaceName, filePath, projectName) {

        let workspace = workspaceManager.getWorkspace(workspaceName)
        let project = workspace.getProject(projectName)
        let projectFile = project.createFile(filePath);

        let resource = repositoryManager.getResource(filePath);
        projectFile.setContent(resource.getContent());
    }

    getAllFilesForDU(du) {
        let context = {};
        const filesAndPackagesObject = this.repo.getAllFilesForDu(context, du);
        return filesAndPackagesObject.files;
    }

    transformPrivileges(calculationViewXml) {
        const privilegesTransformationXslt = `
            <?xml version="1.0" encoding="ISO-8859-1"?>
            <xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

                <xsl:template match="node()|@*">
                    <xsl:copy>
                        <xsl:apply-templates select="node()|@*"/>
                    </xsl:copy>
                </xsl:template>

                <xsl:template match="*[name()='Calculation:scenario']/@applyPrivilegeType">
                    <xsl:attribute name="applyPrivilegeType">
                        <xsl:value-of select="'NONE'"/>
                    </xsl:attribute>
                </xsl:template>

                <xsl:template match="*[name()='Calculation:scenario']/@checkAnalyticPrivileges">
                    <xsl:attribute name="checkAnalyticPrivileges">
                        <xsl:value-of select="'false'"/>
                    </xsl:attribute>
                </xsl:template>
            </xsl:stylesheet>
        `;

        const factory = TransformerFactory.newInstance();
        const source = new StreamSource(new StringReader(privilegesTransformationXslt));
        const transformer = factory.newTransformer(source);
        const text = new StreamSource(new StringReader(calculationViewXml));

        const stringWriter = new StringWriter();
        transformer.transform(text, new StreamResult(stringWriter));
        const res = stringWriter.toString();
        return res;
    }

    transformColumnObject(calculationViewXml) {
        const columnObjectToResourceUriXslt = `
            <?xml version="1.0" encoding="ISO-8859-1"?>
            <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

                <xsl:template match="node()|@*">
                    <xsl:copy>
                        <xsl:apply-templates select="node()|@*"/>
                    </xsl:copy>
                </xsl:template>

                <xsl:template match="DataSource[@type='DATA_BASE_TABLE']/columnObject[@columnObjectName]">
                    <xsl:element name="resourceUri">
                        <xsl:value-of select="@columnObjectName"/>
                    </xsl:element>
                </xsl:template>
            </xsl:stylesheet>
        `;

        const factory = TransformerFactory.newInstance();
        const source = new StreamSource(new StringReader(columnObjectToResourceUriXslt));
        const transformer = factory.newTransformer(source);

        const text = new StreamSource(new StringReader(calculationViewXml));

        const stringWriter = new StringWriter();
        transformer.transform(text, new StreamResult(stringWriter));
        const res = stringWriter.toString();
        return res;
    }

}

module.exports = MigrationService;


