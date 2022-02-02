/*
 * Copyright (c) 2010-2021 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2010-2021 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */

require.config({ paths: { vs: "/services/v4/web/ide-monaco/monaco-editor/min/vs" } });
let editors = [];
migrationLaunchView.controller("ChangesViewController", [
    "$scope",
    "$http",
    "$messageHub",
    "$timeout",
    function ($scope, $http, $messageHub, $timeout) {
        $scope.isVisible = false;
        $scope.dataLoaded = false;
        let viewWidth = document.querySelectorAll(".changes-body")[0].clientWidth | 100;
        $scope.isDiffViewSplit = viewWidth > 1100 ? true : false;
        $scope.data = [];

        // Make the get http request here
        $scope.getData = function () {
            // Replace with an HTTP request
            let demoData = [
                {
                    file: "some/test/file.html",
                    type: "html",
                    original: `<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />`,
                    modified: `<meta http-equiv="Content-Type" content="javascript" />`,
                },
                {
                    type: "html",
                    file: "another/test/file.html",
                    original: `<body></body>`,
                    modified: `<body>
    <div class="main-container">
        <h1>Simple heading</h1>
        <h2>Simple secondary heading</h2>
        <h3>Enough changes</h3>
    </div>
</body>`,
                },
            ];
            // Add additional keys needed by AngularJS
            for (let i = 0; i < demoData.length; i++) {
                demoData[i]["id"] = `m-${i}`;
                demoData[i]["collapsed"] = false;
                demoData[i]["excluded"] = false;
            }
            // Set data variable
            $scope.data = demoData;
            // Set full width for better experience
            $scope.$parent.setFullWidthEnabled(true);
            // Show data
            $scope.dataLoaded = true;
            $scope.$apply();
        };

        $scope.createDiffEditor = function (index) {
            $timeout(function () {
                createDiffView(
                    $scope.data[index].id,
                    $scope.data[index].type,
                    $scope.data[index].original,
                    $scope.data[index].modified,
                    $scope.isDiffViewSplit
                );
            });
        };

        $scope.startMigration = function () {
            // TODO
            for (let i = 0; i < $scope.data.length; i++) {
                if (!$scope.data[i].excluded) {
                    console.log("Migrating file:", $scope.data[i].file);
                }
            }
            $scope.$parent.migrateClicked();
        };

        $scope.splitDiffView = function () {
            $scope.isDiffViewSplit = true;
            for (let i = 0; i < editors.length; i++) {
                editors[i].updateOptions({ renderSideBySide: true });
            }
        };

        $scope.inlineDiffView = function () {
            $scope.isDiffViewSplit = false;
            for (let i = 0; i < editors.length; i++) {
                editors[i].updateOptions({ renderSideBySide: false });
            }
        };

        $scope.previousClicked = function () {
            $scope.$parent.previousClicked();
        };

        $messageHub.on(
            "migration.changes",
            function (msg) {
                if ("isVisible" in msg.data) {
                    $scope.$apply(function () {
                        $scope.dataLoaded = false;
                        $scope.isVisible = msg.data.isVisible;
                        if (msg.data.isVisible) {
                            $scope.$parent.setBottomNavEnabled(false);
                        } else {
                            $scope.data = [];
                            editors = [];
                        }
                    });
                    if (msg.data.isVisible) {
                        setTimeout(function () {
                            $scope.getData();
                        }, 1000);
                    }
                }
            }.bind(this)
        );
    },
]);

function createDiffView(containerId, filetype, originalTxt, modifiedTxt, renderSideBySide = true) {
    require(["vs/editor/editor.main"], function () {
        let container = document.getElementById(containerId);
        let containerLoading = document.querySelector(`#${containerId} > p:first-of-type`);
        monaco.editor.setTheme(monacoTheme);
        let diffEditor = monaco.editor.createDiffEditor(container, {
            automaticLayout: true,
            readOnly: true,
            scrollBeyondLastLine: false,
            enableSplitViewResizing: false,
            renderSideBySide: renderSideBySide,
        });

        const updateHeight = () => {
            const topBorder = parseInt(getComputedStyle(container).getPropertyValue("border-top-width"), 10);
            const bottomBorder = parseInt(getComputedStyle(container).getPropertyValue("border-bottom-width"), 10);
            const contentHeight = diffEditor.getModifiedEditor().getContentHeight() + topBorder + bottomBorder;
            container.style.height = `${contentHeight}px`;
        };

        diffEditor.getModifiedEditor().onDidContentSizeChange(updateHeight);
        diffEditor.setModel({
            original: monaco.editor.createModel(originalTxt, filetype),
            modified: monaco.editor.createModel(modifiedTxt, filetype),
        });

        editors.push(diffEditor);
        containerLoading.remove();
    });
}
