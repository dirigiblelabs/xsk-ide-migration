const tasksService = require('bpm/v4/tasks');
const processService = require('bpm/v4/process');
const httpClient = require("http/v4/client");
const database = require('db/v4/database');
const rs = require("http/v4/rs");
rs.service()
    .resource("start-process")
    .post(startProcess)
    .resource("continue-process")
    .post(continueProcess)
    .resource("get-process")
    .post(getProcessState)
    .resource("migrationsTrack")
    .post(getMigrations)
    .execute();

function startProcess(ctx, req, res) {
    const userDataJson = req.getJSON();
    const neoData = userDataJson.neo;

    const jwtToken = getJwtToken(neoData.hostName, neoData.username, neoData.password);
    const processInstanceId = processService.start('migrationProcess', {
        userData: JSON.stringify(userDataJson),
        userJwtToken: jwtToken,
    });

    const response = {
        processInstanceId: processInstanceId
    };

    res.print(JSON.stringify(response));
}

function getJwtToken(host, username, password) {
    const jwtTokenServiceUrl = `https://oauthasservices.${host}/oauth2/api/v1/token?grant_type=password&username=${username}&password=${password}`;
    const jwtTokenResponse = httpClient.post(jwtTokenServiceUrl, {
        headers: [{
            name: "Content-Type",
            value: "application/x-www-form-urlencoded"
        }]
    });

    const jwtTokenResponseJson = JSON.parse(jwtTokenResponse.text);
    const jwtToken = jwtTokenResponseJson.access_token;
    return jwtToken;
}

function continueProcess(ctx, req, res) {
    const userDataJson = req.getJSON();

    const tasksJson = org.eclipse.dirigible.api.v3.bpm.BpmFacade.getTasks();
    const tasks = JSON.parse(tasksJson);
    for (const task of tasks) {
        if (task.processInstanceId === userDataJson.processInstanceId.toString()) {
            tasksService.completeTask(task.id, {
                userData: JSON.stringify(userDataJson)
            });
            break;
        }
    }
}

function getProcessState(ctx, req, res) {
    const userDataJson = req.getJSON();
    const processInstanceIdString = userDataJson.processInstanceId.toString();
    const migrationState = processService.getVariable(processInstanceIdString, "migrationState");
    const response = {
        migrationState: migrationState
    };

    if (migrationState.endsWith("_FAILED")) {
        response.failed = true;
        const failureReason = processService.getVariable(processInstanceIdString, migrationState + "_REASON");
        if (failureReason) {
            response.failureReason = failureReason;
        }
    } else if (migrationState === "DATABASES_LISTED") {
        const databasesJson = processService.getVariable(processInstanceIdString, "databases");
        response.databases = JSON.parse(databasesJson);
    } else if (migrationState === "WORKSPACES_LISTED") {
        const workspacesJson = processService.getVariable(processInstanceIdString, "workspaces");
        const deliveryUnitsJson = processService.getVariable(processInstanceIdString, "deliveryUnits");
        const connectionId = processService.getVariable(processInstanceIdString, "connectionId");
        response.workspaces = JSON.parse(workspacesJson);
        response.deliveryUnits = JSON.parse(deliveryUnitsJson);
        response.connectionId = connectionId;
    }

    res.print(JSON.stringify(response));
}

function getMigrations(ctx, request, response) {
    const connection = database.getConnection();
    let migrationsData = {migrations: "empty"};
    try {
        var statement = connection.prepareStatement("SELECT * FROM MIGRATIONS");
        var resultSet = statement.executeQuery();
        migrationsData.migrations = resultSet.toJson();
        resultSet.close();
        statement.close();
    } catch (e) {
        console.trace(e);
        console.log(e)
    } finally {
        connection.close();
    }
    response.print(migrationsData.migrations);
}


