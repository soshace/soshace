'use strict';

/**
 * Вид страницы настроек пользователя
 *
 * @class UsersSettingsView
 */

define([
    'zepto',
    'underscore',
    'backbone',
    'handlebars',
    'utils/helpers',
    'backbone.layoutmanager',
    'backbone.validation',
    'templates'
], function ($, _, Backbone, Handlebars, Helpers) {
    return Backbone.Layout.extend({
        /**
         * Модель деталей статьи
         *
         * @field
         * @name UsersSettingsView#model
         * @type {Backbone.Model | null}
         */
        model: null,

        /**
         * Ссылки на DOM элементы
         *
         * @field
         * @name UsersSettingsView#elements
         * @type {Object}
         */
        elements: {
            form: null,
            validateFields: null
        },

        /**
         * Путь до шаблона
         *
         * @field
         * @name UsersSettingsView#elements
         * @type {string}
         */
        template: Soshace.hbs['users/usersSettings'],

        /**
         * Список обработчиков событий
         *
         * @field
         * @name UsersEditView#events
         * @type {Object}
         */
        events: {
            'submit': 'submitHandler'
        },

        /**
         * @constructor
         * @name UsersSettingsView#initialize
         * @returns {undefined}
         */
        initialize: function () {
            Handlebars.registerPartial(
                'usersTabs',
                Soshace.hbs['partials/usersTabs']
            );
            Backbone.Validation.bind(this);
        },

        /**
         * Метод возвращает True, если страница должна быть заблокирована
         * Если пользователь не авторизован или у пользователя не подтвержден email
         * см. Wiki
         *
         * @method
         * @name UsersSettingsView#isDisabled
         * @returns {Boolean}
         */
        isDisabled: function () {
            var app = Soshace.app,
                isAuthenticated = app.isAuthenticated(),
                profile;

            if (!isAuthenticated) {
                return true;
            }

            profile = Soshace.profile;
            return !profile.emailConfirmed;
        },

        /**
         * @method
         * @name UsersSettingsView#serialize
         * @returns {Object}
         */
        serialize: function () {
            var app = Soshace.app,
                isAuthenticated = app.isAuthenticated(),
                data = {},
                model = this.model.toJSON(),
                profile = Soshace.profile,
                isOwner = isAuthenticated && model._id === profile._id;

            data.user = model;
            data.isOwner = isOwner;
            data.isUserSettingsTab = true;
            data.locale = Helpers.getLocale();
            data.isDisabled = this.isDisabled();

            return data;
        },

        /**
         * Method checks if input is valid
         *
         * It uses model prevalidation for new password and then
         * checks if confirm password equals to new password
         * this field
         *
         * @method
         * @name UsersSettingsView#getFormError
         * @param formData
         * @returns {Object || null}
         */
        getFormError: function(formData) {
            var newPasswordError,
                passwordsMatch,
                oldPasswordError;

            oldPasswordError = this.model.preValidate('password', formData.password);
            if (!_.isEmpty(oldPasswordError)) {
                return {
                    password: oldPasswordError
                }
            }

            newPasswordError = this.model.preValidate('password', formData.newPassword);
            if (!_.isEmpty(newPasswordError)) {
                return {
                    newPassword: newPasswordError
                };
            }

            passwordsMatch = formData.newPassword === formData.confirmPassword;
            if (!passwordsMatch) {
                return {
                    confirmPassword: 'Passwords don&#39;t match'
                };
            }

            return null;
        },

        /**
         * @method
         * @name UsersSettingsView#updatePasswordSuccessHandler
         * @returns {undefined}
         */
        updatePasswordSuccessHandler: function() {
            alert(Helpers.i18n('Password change success'));
        },

        /**
         * @method
         * @name UsersSettingsView#updatePasswordErrorHandler
         * @param response
         * @returns {undefined}
         */
        updatePasswordErrorHandler: function(response) {
            var error = Helpers.parseResponseError(response);

            if (error !== null) {
                Helpers.showFieldsErrors(error, true);
            } else {
                console.error(response, response && response.responseText);
            }
        },

        /**
         * Method handler on form submit
         *
         * @method
         * @name UsersSettingsView#submitHandler
         * @param {jQuery.Event} event
         * @returns {*}
         */
        submitHandler: function (event) {
            var formData = Helpers.getFormData(this.elements.form),
                errors = this.getFormError(formData);

            event.preventDefault();

            this.elements.validateFields.controlStatus('base');

            if (errors !== null) {
                Helpers.showFieldsErrors(errors, true);
                return;
            }

            this.model.updatePassword(formData.password, formData.newPassword, {
                success: this.updatePasswordSuccessHandler.bind(this),
                error: this.updatePasswordErrorHandler.bind(this)
            });
        },

        /**
         * Method is user when template is already rendered
         * but we need to set event listeners and set DOM elements
         *
         * @method
         * @name UsersSettingsView#withoutRender
         * @param $el
         * @returns {undefined}
         */
        withoutRender: function ($el) {
            this.$el = $el;
            this.delegateEvents();
            this.afterRender();
        },

        /**
         * Method caches DOM elements in view
         *
         * @method
         * @name UsersSettingsView#setElements
         * @returns {undefined}
         */
        setElements: function () {
            this.elements.validateFields = this.$('.js-validate-input');
            this.elements.form = this.$('.js-form');
        },

        /**
         * @method
         * @name UsersSettingsView#afterRender
         * @returns {undefined}
         */
        afterRender: function () {
            this.setElements();
            this.elements.validateFields.controlStatus();
        }
    });
});