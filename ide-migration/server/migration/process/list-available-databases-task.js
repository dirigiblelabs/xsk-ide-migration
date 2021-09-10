const process = require('bpm/v4/process');

const execution = process.getExecutionContext();
const userDataJson = process.getVariable(execution.getId(), 'userData');
const userData = JSON.parse(userDataJson);

process.setVariable(execution.getId(), 'migrationState', 'DATABASES_LISTING');

const neoData = {
  account: userData.neo.subaccount,
  host: userData.neo.hostName,
  user: userData.neo.username,
  password: userData.neo.password
};

const NeoDatabasesService = require('ide-migration/server/migration/api/neo-databases-service');
const neoDatabasesService = new NeoDatabasesService();
const databases = neoDatabasesService.getAvailableDatabases(neoData);

process.setVariable(execution.getId(), 'databases', JSON.stringify(databases));
process.setVariable(execution.getId(), 'migrationState', 'DATABASES_LISTED');
