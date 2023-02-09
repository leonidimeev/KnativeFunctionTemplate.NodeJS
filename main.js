'use strict';

const fs = require('fs');
const path = require('path');
const Consul = require('consul');
const express = require('express');
const func = require('./function');
const Sentry = require('@sentry/node');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || "development";
let AKN_APPLICATION_NAME;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//#region Consul and appsettings
const consulClient = new Consul({
  host: process.env.APP_CONSUL__ADDRESS || 'localhost'
});

const appSettingsPromise = new Promise((resolve, reject) => {
  let appSettings;

  try {
    // Load appsettings.development.json file
    appSettings = JSON.parse(
        fs.readFileSync(path.join(`./appsettings.${ENV}.json`), "utf-8")
    );
    AKN_APPLICATION_NAME = appSettings["ApplicationName"];

    consulClient.kv.get(AKN_APPLICATION_NAME, (err, result) => {})
        .then(result => {
          if (result){
            let consulAppSettigns = JSON.parse(result.Value);
            // appsettings enrichment
            appSettings = {...appSettings, ...consulAppSettigns};
          }
          resolve(appSettings)
        }).catch((serverErr) => {
      reject(serverErr)
    });
  } catch (error) {
    reject(error);
  }
});
//#endregion

//#region Consul
const registerConsul = async () => {
  try {
    const result = await consulClient.agent.service.register({
      name: `${AKN_APPLICATION_NAME}`,
      address: process.env.APP_OWN__ADDRESS || 'localhost',
      port: PORT
    });
    console.log(`${AKN_APPLICATION_NAME} consul agent has been registered successfully!`);
    return result;
  } catch (err) {
    console.error(err);
  }
};

registerConsul();

//#endregion

//#region Sentry
if (process.env.SENTRY__DSN) {
  Sentry.init({
    dsn: process.env.SENTRY__DSN
  });
}
//#endregion

const handlePostRequest = async (req, res) => {
  let appSettings;
  await appSettingsPromise.then((appSettingsResult) => {
    appSettings = appSettingsResult;
  });
  const response = await func.run(req, appSettings);
  res.end(JSON.stringify(response));
};

app.post('/', handlePostRequest);

app.listen(PORT, () => {
  console.log(`${AKN_APPLICATION_NAME} listening on port `, PORT);
});
