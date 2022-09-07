let LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

let StockCheckService = {
    requestStock: LocalServiceRegistry.createService('StockCheckService', {
        initServiceClient: function() {
            this.webReference = webreferences2.StockCheckService; // eslint-disable-line no-undef
            return this.webReference.getDefaultService();
        },
        /**
         * @param {dw.svc.SOAPService} svc
         * @param {*} args
         */
        createRequest: function(svc, args) {
            let requestObject = new this.webReference.RequestStock();

            requestObject.setFirma(args.firma);
            requestObject.setArtikel(args.artikel);
            requestObject.setGroesseFarbe(args.groesseFarbe);
            requestObject.setVkst(args.vkst);

            return requestObject;
        },
        /**
         * @param {dw.svc.SOAPService} svc
         * @param {*} requestObject
         */
        execute: function(svc, requestObject) {
            return svc.serviceClient.requestStock(requestObject);
        },
        /**
         * @param {dw.svc.SOAPService} svc
         * @param {Object} responseObject
         */
        parseResponse: function(svc, responseObject) {
            let result = [];

            if (responseObject.requestStockResponse) {
                result = responseObject.requestStockResponse.toArray().map(function (data) {
                    return {
                        quantity: data.bestand,
                        isAvailable: data.bestand > 0,
                        productID: data.sku,
                        storeID: data.vkst,
                        companyNumber: data.firmaNr
                    };
                });
            }

            return result;
        }
    }),
    requestVariantStock: LocalServiceRegistry.createService('StockCheckService', {
        initServiceClient: function() {
            this.webReference = webreferences2.StockCheckService; // eslint-disable-line no-undef
            return this.webReference.getDefaultService();
        },
        /**
         * @param {dw.svc.SOAPService} svc
         * @param {*} args
         */
        createRequest: function(svc, args) {
            let requestObject = new this.webReference.RequestVariantStock();

            requestObject.setFirma(args.firma);
            requestObject.setProdukNr(args.produkNr);
            requestObject.setVkst(args.vkst);

            return requestObject;
        },
        /**
         * @param {dw.svc.SOAPService} svc
         * @param {*} requestObject
         */
        execute: function(svc, requestObject) {
            return svc.serviceClient.requestVariantStock(requestObject);
        },
        /**
         * @param {dw.svc.SOAPService} svc
         * @param {Object} responseObject
         */
        parseResponse: function(svc, responseObject) {
            let result = [];

            if (responseObject.requestVariantStockResponse) {
                result = responseObject.requestVariantStockResponse.toArray().map(function (data) {
                    return {
                        quantity: data.bestand,
                        isAvailable: data.bestand > 0,
                        storeID: data.vkst,
                        artvarNr: data.artvarNr
                    };
                });
            }

            return result;
        }
    })
};

module.exports = {
    /**
     * @param {String} action
     * @param {*} args
     */
    call: function(action, args) {
        let service = StockCheckService[action],
            response = null;

        try {
            response = service.call(args);
        } catch (e) {
            require('dw/system/Logger')
                .getLogger('services')
                .error('Error on StockCheckService: {0}', e.message);
        }

        return response;
    }
};
