'use strict';

/**
 * Вид страницы логина
 *
 * @module LoginView
 */

define([
    'zepto',
    'underscore',
    'backbone',
    'utils/helpers',
    'utils/widgets',
    'handlebars',
    'backbone.validation',
    'utils/backboneValidationExtension',
    'utils/plugins/jquery.controlStatus',
    'backbone.layoutmanager',
    'templates'
], function ($, _, Backbone, Helpers, Widgets, Handlebars) {
    return Backbone.Layout.extend({

        /**
         * Модель формы логина
         *
         * @field
         * @name LoginView#model
         * @type {Backbone.Model | null}
         */
        model: null,

        /**
         * Ссылки на DOM элементы вида
         *
         * @field
         * @name LoginView#elements
         * @type {Object}
         */
        elements: {
            validateFields: null,
            authMessages: null,
            loginForm: null
        },

        /**
         * @field
         * @name LoginView#events
         * @type {Object}
         */
        events: {
            'focus .js-validate-input': 'validateFieldFocusHandler',
            'submit .js-login-form': 'userLoginHandler'
        },

        /**
         * Путь до шаблона
         *
         * @field
         * @name LoginView#template
         * @type {string}
         */
        template: Soshace.hbs['auth/auth'],

        /**
         * @constructor
         * @name LoginView#initialize
         * @returns {undefined}
         */
        initialize: function () {
            _.bindAll(this,
                'userLoginSuccess',
                'userLoginFail'
            );

            Handlebars.registerPartial(
                'auth/login',
                Soshace.hbs['partials/auth/login']
            );

            Backbone.Validation.bind(this);
        },

        /**
         * Login submit handler
         *
         * @method
         * @name LoginView#userLoginHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        userLoginHandler: function (event) {
            var errors,
                _this = this,
                formData;

            event.preventDefault();

            formData = Helpers.serializeForm(this.elements.loginForm);
            this.model.set(formData);

            errors = Helpers.getValidationError(formData, this.model);
            if (errors) {
                Helpers.showFieldsErrors(errors, true);
                return;
            }

            this.model.login(formData, {
                success: _this.userLoginSuccess.bind(this),
                error: _this.userLoginFail.bind(this)
            });
        },

        /**
         * Метод обработчик успешной входа пользователя
         *
         * @method
         * @name LoginView#userLoginSuccess
         * @param {Backbone.Model} user
         * @param {Object} response в ответе приходит профиль пользователя
         * @returns {undefined}
         */
        userLoginSuccess: function (user) {
            var app = Soshace.app,
                userName = user.userName,
                locale = user.locale,
                redirectUrl = '/' + locale + '/users/' + userName;

            Soshace.profile = user;
            app.getView('.js-system-messages').collection.fetch().
                done(function () {
                    Backbone.history.navigate(redirectUrl, {trigger: true});
                });
        },

        /**
         * Метод обработчик неуспешного логина пользователя
         *
         * @method
         * @name LoginView#userLoginFail
         * @param {Backbone.Model} model
         * @param {Object} response
         * @returns {undefined}
         */
        userLoginFail: function (error) {
            error = Helpers.parseResponseError(error);

            if (typeof error === 'string') {
                this.showAuthErrorMessage(error);
                return;
            }

            if (typeof error === 'object') {
                Helpers.showFieldsErrors(error, true);
            }
        },

        /**
         * Method shows error message
         *
         * @method
         * @name LoginView#showAuthErrorMessage
         * @param {string} error
         * @returns {undefined}
         */
        showAuthErrorMessage: function (error) {
            var $authMessages = this.elements.authMessages,
                template = Soshace.hbs['messages/errorMessage']({
                    message: error
                });

            $authMessages.html(template).removeClass('hide');
            Helpers.scrollToElementTop($authMessages);
        },

        /**
         * @method
         * @name LoginView#serialize
         * @returns {Object}
         */
        serialize: function () {
            var data = this.model.toJSON();

            data.isLoginTab = true;
            data.paths = Soshace.urls;
            return data;
        },

        /**
         * Метод сохраняет ссылки на элементы DOM
         *
         * @method
         * @name LoginView#setElements
         * @returns {undefined}
         */
        setElements: function () {
            this.elements.validateFields = this.$('.js-validate-input');
            this.elements.authMessages = this.$('.js-auth-messages');
            this.elements.loginForm = this.$('.js-login-form');
        },

        /**
         * Метод обработчик получения фокуса полем валидации
         *
         * @method
         * @name LoginView#validateFieldFocusHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        validateFieldFocusHandler: function (event) {
            var $target = $(event.target);

            $target.controlStatus('base');
        },

        /**
         * @method
         * @name LoginView#afterRender
         * @returns {undefined}
         */
        afterRender: function () {
            this.setElements();
            this.elements.validateFields.controlStatus();
            $('#email').focus();
        }
    });
});