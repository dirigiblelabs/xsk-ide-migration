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

let dao = require('db/v4/dao');
let database = require('db/v4/database');
let migrationsTable = null;


class TrackService {
  setupTable() {
    migrationsTable = dao.create({
      table: "MIGRATIONS",
      properties: [{
        name: "id",
        column: "ID",
        type: "BIGINT",
        id: true
      }, {
        name: "deliveryUnit",
        column: "DELIVERY_UNIT",
        type: "VARCHAR",
        required: false
      }, {
        name: "startedOn",
        column: "STARTED_ON",
        type: "TIMESTAMP",
        required: false
      }, {
        name: "lastUpdated",
        column: "LAST_UPDATED",
        type: "TIMESTAMP",
        required: false
      },
        {
          name: "status",
          column: "STATUS",
          type: "VARCHAR",
          required: false
        }]

    });

    if (!migrationsTable.existsTable()) {
      migrationsTable.createTable();
      console.log("LOG: Migration track table created.")
    } else {
      console.log("LOG: Migration track table already exists");
    }
  }

  addEntry(duName, time, status) {
    if(this.checkDu(duName) === 0){
      migrationsTable.insert({
        deliveryUnit: duName,
        startedOn: time,
        lastUpdated: Date.now(),
        status: status
      });
    }
  }

  updateEntry(deliveryUnit) {
    let connection = database.getConnection();
    try {
      let statement = connection.prepareStatement("UPDATE MIGRATIONS SET STATUS ='MIGRATED', LAST_UPDATED = CURRENT_TIMESTAMP WHERE DELIVERY_UNIT='" + deliveryUnit + "'");
      statement.executeUpdate();
      statement.close();
    } catch (e) {
      console.trace(e);
      console.log(e.message);
    } finally {
      connection.close();
    }
  }

  updateOnStart(deliveryUnit) {
    let connection = database.getConnection();
    try {
      let statement = connection.prepareStatement("UPDATE MIGRATIONS SET STATUS ='PROCESSING', LAST_UPDATED = CURRENT_TIMESTAMP WHERE DELIVERY_UNIT='" + deliveryUnit + "'");
      statement.executeUpdate();
      statement.close();
    } catch (e) {
      console.trace(e);
      console.log(e.message);
    } finally {
      connection.close();
    }
  }

  updateOnFail(deliveryUnit) {
    let connection = database.getConnection();
    try {
      let statement = connection.prepareStatement("UPDATE MIGRATIONS SET STATUS ='FAILED', LAST_UPDATED = CURRENT_TIMESTAMP WHERE DELIVERY_UNIT='" + deliveryUnit + "'");
      statement.executeUpdate();
      statement.close();
    } catch (e) {
      console.trace(e);
      console.log(e.message);
    } finally {
      connection.close();
    }
  }


  checkDu(deliveryUnit) {
    let connection = database.getConnection();
    let result = 0;
    try {
      const statement = connection.prepareStatement("UPDATE MIGRATIONS SET STATUS='QUEUED' WHERE DELIVERY_UNIT ='" + deliveryUnit + "'");
      let resultSet = statement.executeUpdate();
      result = resultSet;
      resultSet.close();
      statement.close();
    } catch (e) {
      console.trace(e);
    } finally {
      connection.close();
    }
    return result;
  }

};
module.exports = TrackService;

