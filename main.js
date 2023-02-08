'use strict';

const fs = require('fs');
const path = require('path');
const Consul = require('consul');
const express = require('express');
const func = require('./function');
const Sentry = require('@sentry/node');

const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || "development";
const AKN_APPLICATION_NAME = process.env.AKN_APPLICATION_NAME || "AKN_APPLICATION_INSERTION_POINT";

const app = express();

// Consul
const consulClient = new Consul({
  host: process.env.APP_CONSUL__ADDRESS || 'localhost'
});

const appSettingsPromise = new Promise((resolve, reject) => {
  // Load appsettings.development.json file
  let appSettings = JSON.parse(
      fs.readFileSync(path.join(`./appsettings.${ENV}.json`), "utf-8")
  );

  consulClient.kv.get(AKN_APPLICATION_NAME, (err, result) => {})
      .then(result => {
        let consulAppSettigns = JSON.parse(result.Value);
        // appsettings enrichment
        appSettings = {...appSettings, ...consulAppSettigns};

        resolve(appSettings)
      }).catch((serverErr) => {
        reject(serverErr)
  });
});

// Sentry
if (process.env.SENTRY__DSN) {
  Sentry.init({
    dsn: process.env.SENTRY__DSN
  });
}

app.post('/', (req, res) => {
  appSettingsPromise.then((result => {
    res.end(JSON.stringify(func.run(req, result)));
  })).catch((err) => {
    console.error(err)
  })
});

app.listen(PORT, () => {
  console.log(`${AKN_APPLICATION_NAME} listening on port `, PORT);

  //#region Register the app with Consul as a service
  consulClient.agent.service.register({
    name: `${AKN_APPLICATION_NAME}`,
    address: process.env.APP_OWN__ADDRESS || 'localhost',
    port: PORT,
  }, (err, result) => {
    console.log (`${AKN_APPLICATION_NAME} consul agent has been registered successfully!\n` + result.Value.toString());
  });
  //#endregion
});
