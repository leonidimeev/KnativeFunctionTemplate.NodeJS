const Sentry = require('@sentry/node');

module.exports = {
    run: (data, appSettings) => {

        //#region (Example) Using sentry
        if (Sentry !== undefined){
            Sentry.captureMessage(`Message to sentry`);
        }
        //#endregion

        data = {
            sampleTime: '1450632410296',
            data: '76.36731:3.4651554:0.5665419',
            endpoint: appSettings.SomeSetting
        };

        return data;
    }
};
