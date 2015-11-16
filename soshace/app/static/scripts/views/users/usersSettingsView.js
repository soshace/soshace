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
         * Метод возвращает True, если
         *
         * @method
         * @name UsersSettingsView#isProfileEmpty
         * @returns {Boolean}
         */
        isProfileEmpty: function(){

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
         * Method returns serialized form
         *
         * @method
         * @name UsersSettingsView#getFormData
         * @returns {Object}
         */
        //ToDo: move to utils
        getFormData: function () {
            var $form = this.elements.form,
                serializedForm = $form.serializeArray();

            return _.object(_.map(serializedForm, function (field) {
                return [field.name, field.value];
            }));
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
            var error,
                passwordsMatch;

            error = this.model.preValidate('password', formData.newPassword);
            if (!_.isEmpty(error)) {
                return {
                    newPassword: error
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
         * Method handler on form submit
         *
         * @method
         * @name UsersSettingsView#submitHandler
         * @param {jQuery.Event} event
         * @returns {*}
         */
        submitHandler: function (event) {
            var formData = this.getFormData(),
                errors = this.getFormError(formData),
                self;

            event.preventDefault();

            this.elements.validateFields.controlStatus('base');

            if (errors !== null) {
                this.showFieldsErrors(errors, false);
                return;
            }

            self = this;

            this.model.updatePassword(formData.password, formData.newPassword, function(error) {
                if (error) {
                    self.showFieldsErrors(error.error);
                    return;
                }

                // TODO: show success message
                alert('password changed!');
            });
        },

        /**
         * Method shows errors list in specified fields
         *
         * @method
         * @name UsersSettingsView#showFieldsErrors
         * @param {Object} errors list of errors
         * @param {boolean} translate
         * @returns {undefined}
         */
        showFieldsErrors: function (errors, translate) {
            _.each(errors, _.bind(function (error, fieldName) {
                var $field;

                fieldName = Helpers.hyphen(fieldName);
                $field = $('#' + fieldName);
                if (translate) {
                    error = Helpers.i18n(error);
                }
                $field.controlStatus('error', error);
            }, this));
        },

        /**
         * Метод используется в тех случаях, когда шаблон уже отрендерен
         * Но надо навесить слушатели и выполнить afterRender и т.д.
         *
         * @method
         * @name UsersSettingsView#withoutRender
         * @returns {undefined}
         */
        withoutRender: function () {
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