'use strict';

/**
 * Creates and configures service instance
 *
 * @retuns {dw.svc.Service}
 */
function requestStock() {
    let LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    return LocalServiceRegistry.createService('collectinstore.dit', {
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {*} args
         */
        createRequest: function (svc, args) {
            let serviceURL = svc.getURL();

            svc.setURL(
                serviceURL +
                (serviceURL.charAt(serviceURL.length - 1) === '/' ? '' : '/') +
                'StockServiceGate/GetRequestStock'
            );
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept', 'application/json');

            return JSON.stringify({
                ArtikelNummer: args.artikel,
                GundF: args.groesseFarbe,
                Firma: args.firma,
                VKSTNr: args.vkst
            });
        },
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {Object} responseObject
         */
        parseResponse: function(svc, responseObject) {
            let result = [];

            if (responseObject.statusCode === 200) {
                let response = JSON.parse(responseObject.text);

                result = response.DieVerfeugbarkeit.map(function (info) {
                    return {
                        quantity: info.Betsand,
                        isAvailable: info.BestandSpecified,
                        productID: info.SKU,
                        storeID: info.VKSTNr,
                        companyNumber: info.FirmaNr
                    };
                });
            }

            return result;
        },
        mockCall: function() {
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: JSON.stringify({
                    'DieVerfeugbarkeit': [
                        {
                            'Betsand': 5,
                            'BestandSpecified': true,
                            'FirmaNr': 138,
                            'FirmaNrSpecified': true,
                            'SKU': 'q-1-1',
                            'VKSTNr': '8'
                        }
                    ],
                    'StatusCode': '0',
                    'StatusText': 'OK!'
                })
            };
        },
        /**
         * @param {dw.svc.HTTPService} svc
         * @param {String} msg
         */
        filterLogMessage: function(msg) {
            return msg;
        }
    });
}

module.exports.requestStock = requestStock;
