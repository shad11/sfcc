'use strict';

/**
 * property files helper module
 *
 * @module util/web/CustomResource
 */

const Resource = require('dw/web/Resource');
const SiteId = require('dw/system/Site').getCurrent().getID();
const CustomResourceCache =
    require('dw/system/CacheMgr').getCache('CustomResources');

//used to mark translations as 'did not find'
const DNF = null;
const MappingName = 'c_resource_bundles_' + SiteId;

const localeStack = (function () {
    const locale = request.locale;
    let stack = [];

    if (locale !== 'default') {
        let locFra = locale.split('_');

        stack.push(locale);
        if (locFra.length > 1) {
            stack.push(locFra[0]);
        }
    }

    stack.push('default');
    return stack;
}());

//stores the source for resource lookup, 'System', 'KeyValueMap', 'DynamicFolder' (default)
const messageSource = 'DynamicFolder';

//Defines if system translations should be retrieved via cache once they have initially been resolved
const cacheEnabled = (function () {
    return messageSource === 'DynamicFolder' || messageSource === 'KeyValueMap';
}());

/**
 * Returns cache key for translations by bundle name, key, locale and site id
 *
 * @param {string} bundleName The bundle name
 * @param {string} key The lookup key.
 */
function getCacheKey(bundleName, key) {
    return [SiteId, request.locale, bundleName, key].join('.');
}

/**
 * Tries to retrieve the actual text from the cache using the current locale as part of the lookup key.
 *
 * @param {string} key The lookup key.
 * @param {string} bundleName The bundle name
 */
function cacheGet(key, bundleName) {
    if (key && bundleName) {
        return CustomResourceCache.get(getCacheKey(bundleName, key));
    }

    return null;
}

/**
 * Puts a new translation to the cache using the current locale as part of the lookup key.
 *
 * @param {string} key The lookup key.
 * @param {string} bundleName The bundle name
 * @param {string} message The message
 */
function cachePut(key, bundleName, message) {
    if (key && bundleName) {
        // adds the new entry only if key and bundleName are of type string
        // AND the message is either null or also a string.
        if (
            typeof key === 'string' &&
            typeof bundleName === 'string' &&
            (message === null || typeof message === 'string')
        ) {
            CustomResourceCache.put(
                getCacheKey(bundleName, key),
                message || DNF
            );
        }
    }
}

/**
 * Get the mappingkey value
 *
 * @return String The string value
 */
function getBaseMsg(key, bundleName, args) {
    // eslint-disable-line complexity
    if (!(key && bundleName)) {
        return null;
    }

    const argsCache =
        cacheEnabled && arguments.length > 2 ?
            '.' + (Array.isArray(args) ? args.join('.') : args) :
            '';

    //finding cache entries first
    if (cacheEnabled) {
        const resultMessage = cacheGet(key + argsCache, bundleName);

        if (resultMessage !== undefined) {
            return resultMessage;
        }
    }

    let message = null;

    if (messageSource === 'DynamicFolder') {
        message = arguments.length > 2 ?
            Resource.msgf(
                  key,
                  'co_' + bundleName,
                  Resource.msg(key, bundleName, ''),
                  args
              ) :
            Resource.msg(
                  key,
                  'co_' + bundleName,
                  Resource.msg(key, bundleName, '')
              );
    } else if (messageSource === 'KeyValueMap') {
        const MappingKey = require('dw/util/MappingKey');
        const MappingMgr = require('dw/util/MappingMgr');

        //try to find message in map
        for (let i = 0; i < localeStack.length && message === null; i++) {
            try {
                let locale = localeStack[i];
                let mappingKey = new MappingKey(key, bundleName, locale);
                let valueMap = MappingMgr.get(MappingName, mappingKey);

                if (valueMap !== null) {
                    message = valueMap.message;
                }
            } catch (e) {
                // do nothing
            }
        }
    }

    if (cacheEnabled) {
        cachePut(key + argsCache, bundleName, message);
    }

    return message;
}

/**
 * A custom implementation a Generic Maps based Resource Bundle Manager
 */
module.exports = {
    /**
     * Returns the message from the default properties resource bundle (base name "message") corresponding to the
     * specified key and the request locale. static msg(key : String)
     *
     * @return String message
     */
    msg1: function (key) {
        // no bundle specified -> base name = message
        const bundleName = 'message';
        const baseMsg = getBaseMsg(key, bundleName);

        if (baseMsg === null || baseMsg === undefined) {
            const message = Resource.msg(key, bundleName);

            cachePut(key, bundleName, message);
            return message;
        }

        return baseMsg;
    },

    /**
     * static msg(key : String, defaultMessage: String)
     *
     * @return String message
     */
    msg2: function (key, defaultMsg) {
        // no bundle specified -> base name = message
        const bundleName = 'message';
        const baseMsg = getBaseMsg(key, bundleName);

        // if defaultmessage is null, key should be returned if nothing is found
        defaultMsg = defaultMsg || key;

        if (baseMsg === null || baseMsg === undefined) {
            const message = Resource.msg(key, bundleName, defaultMsg);

            cachePut(key, bundleName, message);
            return message;
        }

        return baseMsg || defaultMsg;
    },

    /**
     * static msg(key : String, bundleName : String, defaultMessage : String) : String
     *
     * @return String message
     */
    msg3: function (key, bundleName, defaultMsg) {
        // if defaultmessage is null, key should be returned if nothing is found
        defaultMsg = defaultMsg || key;

        // no bundle specified -> base name = message
        bundleName = bundleName || 'message';

        const baseMsg = getBaseMsg(key, bundleName);

        if (baseMsg === null || baseMsg === undefined) {
            const message = Resource.msg(key, bundleName, defaultMsg);

            cachePut(key, bundleName, message);
            return message;
        }

        return baseMsg || defaultMsg;
    },

    /**
     * static msgf(key : String, bundleName : String, defaultMessage : String, args : Object...) : String
     *
     * @return String message
     */
    // eslint-disable-next-line complexity
    msgf: function (key, bundleName, defaultMsg, args) {
        // if defaultmessage is null, key should be returned if nothing is found
        defaultMsg = defaultMsg || key;

        // no bundle specified -> base name = message
        bundleName = bundleName || 'message';

        const msgArgs = arguments.length > 4 ?
            Array.prototype.slice.call(arguments).slice(3) :    // Array.slice(3) from version 21.2
            args;

        const argsCache = arguments.length > 4 ?
            '.' + (Array.isArray(msgArgs) ? msgArgs.join('.') : msgArgs) :
            '.' + args;

        // get new string
        let baseMsg = getBaseMsg(key, bundleName, msgArgs);

        if (baseMsg === null || baseMsg === undefined) {
            baseMsg = Resource.msgf(key, bundleName, defaultMsg, msgArgs);
            cachePut(key + argsCache, bundleName, baseMsg);
        }

        return baseMsg || defaultMsg;
    },

    /**
     * function dispatcher to simulate overloading 1-3 arguments are allowed otherwise return null (key) (key,
     * defaultmessage) (key, bundleName, defaultmessage) static msg()
     * @return String message || null
     */
    msg: function () {
        switch (arguments.length) {
            case 1:
                return this.msg1(arguments[0]);
            case 2:
                return this.msg2(arguments[0], arguments[1]);
            case 3:
                return this.msg3(arguments[0], arguments[1], arguments[2]);
            default:
                return null;
        }
    }
};
