'use strict';

var _ = require('underscore'),
    Handlebars = require('express3-handlebars').create(),
    RequestParams = require('./requestParams');

/**
 * Модуль отправки сообщений
 * noreply@soshace.com
 */
var NodeMailer = require('nodemailer'),
    transport = NodeMailer.createTransport('SMTP', {
        service: Soshace.MAIL_SERVICE,
        auth: {
            user: Soshace.MAIL_NO_REPLY,
            pass: Soshace.MAIL_NO_REPLY_PASSWORD
        }
    });

var SendMail = {
    /**
     * Метод возвращает ссылку для подтверждения email
     *
     * @method
     * @name SendMail.getConfirmationLink
     * @param {String} locale
     * @param {string} code код подтверждения email
     * @returns {string}
     */
    getConfirmationLink: function (locale, code) {
        var host = Soshace.LOCAL_MACHINE ? Soshace.LOCAL_HOST + ':' + Soshace.PORT : Soshace.PRODUCTION_HOST;
        return 'http://' + host + '/' + locale + '/registration/confirm_email?code=' + code;
    },

    /**
     * Returns the link for password resetting
     *
     * @method
     * @name SendMail.getPasswordResetLink
     * @param {String} locale
     * @param {string} code for email confirmation
     * @returns {string}
     */
    getPasswordResetLink: function (locale, code) {
        var host = Soshace.LOCAL_MACHINE ? Soshace.LOCAL_HOST + ':' + Soshace.PORT : Soshace.PRODUCTION_HOST;
        return 'http://' + host + '/' + locale + '/reset-password?code=' + code;
    },

    /**
     * Отправляем письмо подтверждения аккаунта
     *
     * @function
     * @name SendMail.sendConfirmMail
     * @param {Object} request
     * @param {Object} user модель пользователя
     * @return {undefined}
     */
    sendConfirmMail: function (request, user) {
        var requestParams = new RequestParams(request),
            locale = request.i18n.getLocale(),
            mailTemplatePath = Soshace.DIR_NAME + '/app/views/mails/confirmationMail.hbs',
            confirmationLink = this.getConfirmationLink(locale, user.code),
            mailSubject = request.i18n.__('Confirmation message from Soshace blog');

        Handlebars.render(mailTemplatePath, _.extend(requestParams, {
            userName: user.userName,
            emailConfirmLink: confirmationLink
        }), function (error, template) {
            transport.sendMail({
                from: Soshace.MAIL_NO_REPLY,
                to: user.email,
                subject: mailSubject,
                html: template
            });
        });
    },

    /**
     * Отправляем письмо подтверждения аккаунта
     *
     * @function
     * @name SendMail.sendPasswordResetMail
     * @param {Object} request
     * @param {Object} user модель пользователя
     * @return {undefined}
     */
    sendPasswordResetMail: function (request, user, code) {
        var requestParams = new RequestParams(request),
            locale = request.i18n.getLocale(),
            mailTemplatePath = Soshace.DIR_NAME + '/app/views/mails/resetPasswordMail.hbs',
            passwordResetLink = this.getPasswordResetLink(locale, code),
            mailSubject = request.i18n.__('Password resetting message from Soshace blog');

        Handlebars.render(mailTemplatePath, _.extend(requestParams, {
            userName: user.userName,
            passwordResetLink: passwordResetLink
        }), function (error, template) {
            transport.sendMail({
                from: Soshace.MAIL_NO_REPLY,
                to: user.email,
                subject: mailSubject,
                html: template
            });
        });
    }
};

_.bindAll(SendMail, 'sendConfirmMail', 'sendPasswordResetMail');
module.exports = SendMail;