'use strict';

/**
 * Вид страницы восстановления пароля
 *
 * @class RemindPasswordView
 */

define([
    'zepto',
    'underscore',
    'backbone',
    'utils/helpers',
    'backbone.validation',
    'utils/backboneValidationExtension',
    'utils/plugins/jquery.controlStatus',
    'backbone.layoutmanager',
    'templates'
], function ($, _, Backbone, Helpers) {
    return Backbone.Layout.extend({

        /**
         * Модель формы восттановления пароля
         *
         * @field
         * @name RemindPasswordView#model
         * @type {Backbone.Model | null}
         */
        model: null,

        /**
         * Ссылки на DOM элементы вида
         *
         * @field
         * @name RemindPasswordView#elements
         * @returns {undefined}
         */
        elements: {
            emailField: null
        },

        /**
         * Список обработчиков событий
         *
         * @field
         * @name RemindPasswordView#events
         * @type {Object}
         */
        events: {
            'focus .js-email-field': 'emailFieldFocusHandler',
            'submit': 'submitHandler'
        },

        /**
         * Путь до шаблона
         *
         * @field
         * @name RemindPasswordView#template
         * @type {string}
         */
        template: Soshace.hbs['auth/remindPassword'],

        /**
         * @constructor
         * @name RemindPasswordView#initialize
         * @returns {undefined}
         */
        initialize: function () {
            Backbone.Validation.bind(this);
        },

        /**
         * Form submit handler
         *
         * @method
         * @name RemindPasswordView#submitHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        submitHandler: function (event) {
            var errors,
                $email = this.elements.emailField,
                emailValue = $.trim($email.val()).toLowerCase();

            event.preventDefault();

            emailValue = emailValue.toLowerCase();

            errors = Helpers.getValidationError({
                email: emailValue
            }, this.model);

            if (!_.isEmpty(errors)) {
                Helpers.showFieldsErrors(errors, true);
                return;
            }

            this.model.remindPassword(emailValue, {
                success: this.submitSuccessHandler,
                error: this.submitFailHandler
            });
        },

        /**
         * Submit success handler
         *
         * @method
         * @name RemindPasswordView#submitSuccessHandler
         * @param {Backbone.Model} model
         * @param {Object} response
         * @returns {undefined}
         */
        submitSuccessHandler: function (model, response) {
            alert(Helpers.i18n('Check your email to change password'));
        },

        /**
         * Submit error handler
         *
         * @method
         * @name RemindPasswordView#submitFailHandler
         * @param {Backbone.Model} model
         * @param {Object} response
         * @returns {undefined}
         */
        submitFailHandler: function (model, response) {
            var error = Helpers.parseResponseError(response);

            if (error === null) {
                console.error('remind password error');
                return;
            }

            if (typeof error === 'string') {
                console.error(error);
                return;
            }

            Helpers.showFieldsErrors(error, false);
        },

        /**
         * Метод обработчик получения фокуса полем email
         *
         * @method
         * @name RemindPasswordView#emailFieldFocusHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        emailFieldFocusHandler: function (event) {
            var $target = $(event.target);

            $target.controlStatus('base');
        },

        /**
         * @method
         * @name RemindPasswordView#setElements
         * @returns {undefined}
         */
        setElements: function () {
            this.elements.emailField = $('#email');
        },

        /**
         * @method
         * @name RemindPasswordView#afterRender
         * @returns {undefined}
         */
        afterRender: function () {
            var $email;

            this.setElements();
            $email = this.elements.emailField;

            $email.controlStatus();
            //Используется асинхронный вызов, чтобы навесились обработчики событий
            setTimeout(function () {
                $email.focus();
            }, 0);
        }
    });
});