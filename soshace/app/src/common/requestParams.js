'use strict';

/**
 * Модуль возвращает переменные, зависисмые от запроса и
 * переменные общие для шаблонов
 *
 * @constructor
 * @name requestParams
 * @param {Object} request
 * @returns {Object}
 */
module.exports = function (request) {
    var HandlebarsHelpers = require('./handlebarsHelpers'),
        helpers = new HandlebarsHelpers(request),
        profile = request.user && request.user[0],
        profileUserName = profile && profile.userName,
        isProduction = Soshace.IS_PRODUCTION,
        localHost = Soshace.LOCAL_HOST,
        productionHost = Soshace.PRODUCTION_HOST,
        host = isProduction ? productionHost : localHost;

    return {
        isProduction: isProduction,
        host: host,
        version: Soshace.VERSION,
        helpers: helpers,
        locale: request.i18n.getLocale(),
        isAuthenticated: profile && request.isAuthenticated(),
        paths: Soshace.PATHS,
        profile: profile || {},
        profileUserName: profileUserName,
        //для шаблонов
        backend: true
    };
};