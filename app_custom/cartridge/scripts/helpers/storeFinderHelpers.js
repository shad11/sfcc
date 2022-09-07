const Result = require('dw/svc/Result');
const Logger = require('dw/system/Logger');

//eslint-disable-next-line max-len
const ERROR_MSG = 'There was an error during the call service "DIT". The error specific code is: {0}. The error message is: {1}';
const UNAVAILABLE_MSG = 'The service "DIT" could not be reached due to: {0}';

/**
 * Parse response from Store service
 *
 * @param {dw.svc.Service} serviceResponse
 * @returns {Object}
 */
function parseStoresAvailabilityResponse(serviceResponse) {
    let storesAvailabilityResponse = {
        results: [],
        error: true,
        errorMsg: 'There was an error during the call'
    };

    if (serviceResponse.status === Result.OK) {
        storesAvailabilityResponse.error = false;
        storesAvailabilityResponse.errorMsg = '';

        storesAvailabilityResponse.results = serviceResponse.object.toArray().filter(function (availabilityInfo) {
            return availabilityInfo.isAvailable;
        });
    } else if (serviceResponse.status === Result.ERROR) {
        Logger.getLogger('storeFinder', 'storeFinderNew')
            .error(ERROR_MSG, serviceResponse.error, serviceResponse.errorMessage);
    } else if (serviceResponse.unavailableReason !== Result.UNAVAILABLE_DISABLED) {
        Logger.getLogger('storeFinder', 'storeFinderNew')
            .error(UNAVAILABLE_MSG, serviceResponse.unavailableReason);
    }

    return storesAvailabilityResponse;
}

/**
 * Find in stores using an old service
 *
 * @param {dw.catalog.Product} product
 * @param {String} firmNumber
 * @param {dw.util.Collection} stores
 * @returns {Object}
 */
exports.findStoresOld = function (product, firmNumber, stores) {
    const serviceResponse = require('*/cartridge/scripts/services/BitaService')
        .requestStock()
        .call({
            artikel: product.getCustom().articleCode,
            groesseFarbe: product.getCustom().size,
            firma: firmNumber,
            vkst: stores
        });

    return parseStoresAvailabilityResponse(serviceResponse);
}

/**
 * Find in stores using a new service
 *
 * @param {dw.catalog.Product} product
 * @param {String} firmNumber
 * @param {dw.util.Collection} stores
 * @returns {Object}
 */
exports.findStoresNew = function (product, firmNumber, stores) {
    const serviceResponse = require('*/cartridge/scripts/services/StockCheckService')
        .call('requestStock', {
            artikel: product.getCustom().articleCode,
            groesseFarbe: product.getCustom().size,
            firma: firmNumber,
            vkst: stores
        });

    return parseStoresAvailabilityResponse(serviceResponse);
}
