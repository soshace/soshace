'use strict';

/**
 * Password reset page view
 *
 * @module PasswordResetView
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
         * Page reset model
         *
         * @field
         * @name PasswordResetView#model
         * @type {Backbone.Model | null}
         */
        model: null,

        /**
         * Ссылки на DOM элементы вида
         *
         * @field
         * @name PasswordResetView#elements
         * @type {Object}
         */
        elements: {
            validateFields: null,
            authMessages: null,
            passwordResetForm: null
        },

        /**
         * @field
         * @name PasswordResetView#events
         * @type {Object}
         */
        events: {
            'focus .js-validate-input': 'validateFieldFocusHandler',
            'submit .js-password-reset-form': 'resetPasswordHandler'
        },

        /**
         * Путь до шаблона
         *
         * @field
         * @name PasswordResetView#template
         * @type {string}
         */
        template: Soshace.hbs['auth/remindPasswordSuccess'],

        /**
         * @constructor
         * @name PasswordResetView#initialize
         * @returns {undefined}
         */
        initialize: function () {
            _.bindAll(this,
                'resetPasswordSuccess',
                'resetPasswordFail'
            );

            Backbone.Validation.bind(this);
        },


        /**
         * Sets form data to model and validates it using cached results and model validation
         *
         * @name PasswordResetView#setFieldDataAndGetInputErrors
         * @method
         * @param formData
         * @returns {Object || null}
         */
        getValidationError: function(formData) {
            var validationError = Helpers.getValidationError(formData, this.model),
                passwordsMatch;

            if (validationError !== null) {
                return validationError;
            }

            passwordsMatch = formData.password === formData.confirmPassword;

            if (!passwordsMatch) {
                return {
                    confirmPassword: 'Passwords must match'
                };
            }

            return null;
        },

        /**
         * Submits password reset form
         *
         * @method
         * @name PasswordResetView#resetPasswordHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        resetPasswordHandler: function (event) {
            var errors,
                _this = this,
                formData = Helpers.serializeForm(this.elements.passwordResetForm);

            event.preventDefault();

            errors = this.getValidationError(formData);

            if (errors !== null) {
                Helpers.showFieldsErrors(errors, true);
                return;
            }

            this.model.resetPassword({
                password: formData.password,
                token: formData.token,
                email: formData.email
            }, {
                success: _this.resetPasswordSuccess,
                error: _this.resetPasswordFail
            });
        },

        /**
         * Method redirects user after successful password change
         *
         * @method
         * @name LoginView#userLoginSuccess
         * @param {Backbone.Model} model
         * @param {Object} response в ответе приходит профиль пользователя
         * @returns {undefined}
         */
        resetPasswordSuccess: function (model, response) {
            var app = Soshace.app,
                redirectUrl;

            redirectUrl = '/' + Helpers.getLocale();
            app.getView('.js-system-messages').collection.fetch().
                done(function () {
                    Backbone.history.navigate(redirectUrl, {trigger: true});
                });
        },

        /**
         * Method handler of submit fail
         *
         * @method
         * @name LoginView#userLoginFail
         * @param {Backbone.Model} model
         * @param {Object} response
         * @returns {undefined}
         */
        resetPasswordFail: function (response) {
            var error = Helpers.parseResponseError(response);

            if (typeof error === 'object') {
                Helpers.showFieldsErrors(error, true);
                return;
            }

            console.error(response && response.responseText, error);
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
            //this.elements.authMessages = this.$('.js-auth-messages');
            this.elements.passwordResetForm = this.$('.js-password-reset-form');
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
            $('#password').focus();
        }
    });
});