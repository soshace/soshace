'use strict';
var _ = require('underscore'),
    Controller = srcRequire('common/controller'),
    UsersModel = srcRequire('models/usersModel'),
    RequestParams = srcRequire('common/requestParams'),
    SystemMessagesModel = srcRequire('models/systemMessagesModel'),
    SendMail = srcRequire('common/sendMail');


/**
 * Контроллер страницы регистрации
 *
 * @class RegistrationController
 */
module.exports = Controller.extend({

    /**
     * @constructor
     * @name RegistrationController#initialize
     * @param {Object} request Объект запроса
     * @param {Object} response Объект ответа
     */
    initialize: function (request, response) {
        this.request = request;
        this.response = response;

        _.bindAll(this,
            'userSaveHandler',
            'confirmEmailHandler',
            'loginUser'
        );
    },

    /**
     * Рендерим страницу регистрации
     *
     * @public
     * @function
     * @name RegistrationController#renderRegistration
     * @return {undefined}
     */
    renderRegistration: function () {
        var request = this.request,
            response = this.response,
            requestParams = new RequestParams(request),
            locale,
            profileUserName;

        if (requestParams.isAuthenticated) {
            locale = requestParams.locale;
            profileUserName = requestParams.profileUserName;
            response.redirect('/' + locale + '/users/' + profileUserName);
            return;
        }

        response.render('auth/auth', _.extend(requestParams, {
            isAuthTab: true,
            isRegistrationTab: true,
            title: 'Registration page'
        }));
    },

    /**
     * Метод удаляет сообщение о том, что email не подтвержден и добавляет успешное
     * сообщение
     *
     * @method
     * @name RegistrationController#updateUserMessagesAfterConfirmEmail
     * @param {UsersModel} user
     * @param {Function} callback
     * @returns {undefined}
     */
    updateUserMessagesAfterConfirmEmail: function (user, callback) {
        SystemMessagesModel.removeMessage({ownerId: user._id, alias: 'notConfirmedEmail'}, function (error) {
            var successConfirmEmail;

            if (error) {
                callback(error);
                return;
            }

            successConfirmEmail = new SystemMessagesModel({
                alias: 'successConfirmEmail',
                ownerId: user._id,
                templatePath: 'messages/successConfirmEmail',
                showOnce: true,
                pages: ['postEdit']
            });
            successConfirmEmail.save(function (error) {
                if (error) {
                    callback({error: {message: 'Server is too busy, try later', code: 503}});
                    return;
                }

                callback(null, user);
            });
        });
    },

    /**
     * Метод обработчик подтверждения аккаунта с email
     *
     * @function
     * @name RegistrationController#confirmEmail
     * @return {undefined}
     */
    confirmEmail: function () {
        var request = this.request,
            confirmCode = request.query.code;

        UsersModel.confirmEmail(confirmCode, this.confirmEmailHandler);
    },

    /**
     *
     * Метод обработчик положительного
     * подтверждения кода пользователя
     *
     * @method
     * @name RegistrationController#confirmEmailHandler
     * @param {Object} error
     * @param {UsersModel} user
     * @returns {undefined}
     */
    confirmEmailHandler: function (error, user) {
        if (error) {
            this.renderError(error, 503);
            return;
        }
        this.updateUserMessagesAfterConfirmEmail(user, this.loginUser);
    },

    /**
     * Метод обработчик положительного
     * подтверждения кода пользователя
     *
     * @method
     * @name RegistrationController#loginUser
     * @param {Object} error
     * @param {UsersModel} user
     * @returns {undefined}
     */
    loginUser: function (error, user) {
        var request = this.request,
            response = this.response,
            locale = request.i18n.getLocale();

        if (error) {
            this.renderError('Server is too busy, try later', 503);
            return;
        }

        request.login(user, _.bind(function (error) {
            if (error) {
                this.renderError('Server is too busy, try later', 503);
                return;
            }
            response.redirect('/' + locale + '/posts/new/');
        }, this));
    },

    /**
     * Method creates user in db
     *
     * @method
     * @name RegistrationController#createUser
     * @returns {undefined}
     */
    createUser: function () {
        var request = this.request,
            userData = request.body,
            user;

        if (_.isEmpty(userData)) {
            this.sendError('Bad request');
            return;
        }

        user = new UsersModel(userData);
        user.save(this.userSaveHandler);
    },

    /**
     * Method formats error from db for client if saving fails
     *
     * @method
     * @name RegistrationController#formatErrorsFromDB
     * @param errors
     * @returns {Object}
     */
    formatErrorsFromDB: function(errors) {
        if (errors === null) {
            errors = {};
        }
        return _.reduce(errors, function(formattedErrors, error, fieldName) {
            formattedErrors[fieldName] = error && error.message;
            return formattedErrors;
        }, {});
    },

    /**
     * User save success handler
     *
     * @method
     * @name RegistrationController#userSaveHandler
     * @param {Object} error объект ошибки
     * @param {UsersModel} user модель пользователя
     * @returns {undefined}
     */
    userSaveHandler: function (error, user) {
        if (error) {
            if (error.errors) {
                this.sendError({
                    error: this.formatErrorsFromDB(error.errors)
                });
                return;
            }

            this.sendError('Server is too busy, try later', 503);
            return;
        }

        this.userAddSuccess(user);
    },

    /**
     * Метод валидирует поля регистрации
     *
     * @method
     * @name RegistrationController#validateField
     * @returns {undefined}
     */
    validateField: function () {
        var request = this.request,
            response = this.response,
            requestData = request.body,
            fieldName = _.keys(requestData)[0],
            user = new UsersModel(requestData);

        //TODO: добавить проверку на наличие поля в модели
        user.validate(_.bind(function (error) {
            var errors = error && error.errors,
                errorMessage = errors && errors[fieldName] || null;

            if (errorMessage) {
                this.sendError({error: errorMessage});
                return;
            }

            response.send({error: null});
        }, this));
    },

    /**
     * Метод добавляет системное сообщение о том, что пользователь
     * не подтвердил email
     *
     * @method
     * @name RegistrationController#addNotConfirmedEmailMessage
     * @param {UsersModel} user
     * @returns {undefined}
     */
    addNotConfirmedEmailMessage: function (user) {
        var notConfirmedEmailMessage = new SystemMessagesModel({
            alias: 'notConfirmedEmail',
            ownerId: user._id,
            templatePath: 'messages/notConfirmedEmail',
            pages: [
                'user',
                'postEdit',
                'userEdit',
                'userSettings'
            ],
            readOnly: true
        });

        notConfirmedEmailMessage.save();
    },

    /**
     * Метод обработчик успешного добавления пользователя
     *
     * @method
     * @name RegistrationController#userAddSuccess
     * @param {UsersModel} user
     * @returns {undefined}
     */
    userAddSuccess: function (user) {
        var request = this.request,
            response = this.response,
            locale = request.i18n.getLocale(),
            userName = user.userName,
            profile,
            redirectUrl;

        this.addNotConfirmedEmailMessage(user);
        request.login(user, _.bind(function (error) {
            if (error) {
                this.sendError('Server is too busy, try later', 503);
                return;
            }

            profile = user.getProfileFields();
            redirectUrl = '/' + locale + '/users/' + userName;
            SendMail.sendConfirmMail(request, user);
            response.cookie('isAuthenticated', '1');
            response.cookie('profileUserName', userName);
            response.send({
                profile: profile,
                redirect: redirectUrl
            });
        }, this));
    }
});