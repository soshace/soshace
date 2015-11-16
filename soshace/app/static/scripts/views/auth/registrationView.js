'use strict';

/**
 * Вид страницы регистрации
 *
 * @class RegistrationView
 */

define([
    'zepto',
    'underscore',
    'backbone',
    'utils/helpers',
    'handlebars',
    'backbone.validation',
    'utils/backboneValidationExtension',
    'utils/plugins/jquery.controlStatus',
    'backbone.layoutmanager',
    'templates'
], function ($, _, Backbone, Helpers, Handlebars) {
    return Backbone.Layout.extend({

        /**
         * Registration form model
         *
         * @field
         * @name RegistrationView#model
         * @type {Backbone.Model | null}
         */
        model: null,

        /**
         * Server cache for fields validation
         *
         * @field
         * @name RegistrationView#cacheServerResponse
         * @type {Object | null}
         */
        cacheServerResponse: null,

        /**
         * Cached links to DOM elements
         *
         * @field
         * @name RegistrationView#elements
         * @type {Object}
         */
        elements: {
            registrationForm: null
        },

        /**
         * Field includes debounce decorated methods
         * setStatus for each field
         *
         * each field must have it's own debounce method
         * to show errors on fast focus change

         *
         * @field
         * @name RegistrationView#statusDebounceHandlers
         * @type {Object | null}
         */
        statusDebounceHandlers: null,

        /**
         * View events
         *
         * @field
         * @name RegistrationView#events
         * @type {Object}
         */
        events: {
            'keyup .js-model-field': 'changeFormFieldHandler',
            'focus .js-model-field': 'focusFormFieldHandler',
            'blur .js-model-field': 'changeFormFieldHandler',
            'submit': 'userRegistrationHandler'
        },

        /**
         * Template path
         *
         * @field
         * @name RegistrationView#template
         * @type {string}
         */
        template: Soshace.hbs['auth/auth'],

        /**
         * @constructor
         * @name RegistrationView#initialize
         * @returns {undefined}
         */
        initialize: function () {
            _.bindAll(this,
                'userRegistrationSuccess',
                'userRegistrationFail'
            );

            Handlebars.registerPartial(
                'auth/registration',
                Soshace.hbs['partials/auth/registration']
            );
            Backbone.Validation.bind(this);

            this.cacheServerResponse = {};

            this.statusDebounceHandlers = {};
            this.setStatusHandlers();
        },

        /**
         * Cache server response by field name and value
         *
         * @method
         * @name RegistrationView#setResponseToCache
         * @param fieldName
         * @param fieldValue
         * @param status
         * @param message
         * @returns {undefined}
         */
        setResponseToCache: function(fieldName, fieldValue, status, message) {
            this.cacheServerResponse[fieldName] = {};
            this.cacheServerResponse[fieldName][fieldValue] = {
                status: status,
                message: message || null
            };
        },

        /**
         * Get server response from cache by field name and field value
         *
         * @method
         * @param fieldName
         * @param fieldValue
         * @returns {Object | null}
         */
        getResponseFromCache: function(fieldName, fieldValue) {
            var fieldCache = this.cacheServerResponse[fieldName];
            if (fieldCache === undefined) {
                return null;
            }

            return fieldCache[fieldValue] || null
        },

        /**
         * Method returns debounce decorated method setStatus for each model field
         *
         * @method
         * @name RegistrationView#setStatusHandlers
         * @returns {undefined}
         */
        setStatusHandlers: function () {
            var registrationData = this.model.getRegistrationData();
            delete registrationData.locale;

            _.each(registrationData, _.bind(function (fieldValue, fieldName) {
                this.statusDebounceHandlers[fieldName] = _.debounce(_.bind(this.setStatus, this), 500);
            }, this));
        },

        /**
         * Checks if input has error in cached validation results
         *
         * @method
         * @name RegistrationView#checkCacheForError
         * @param formData
         * @returns {boolean}
         */
        checkCacheForError: function(formData) {
            return _.some(formData, function(fieldValue, fieldName) {
                var cachedValidationResult = this.getResponseFromCache(Helpers.camelCase(fieldName), fieldValue);
                if (cachedValidationResult === null) {
                    return false;
                }

                return cachedValidationResult.status === 'error';
            }, this);
        },

        /**
         * Submit handler
         *
         * @method
         * @name RegistrationView#userRegistrationHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        userRegistrationHandler: function (event) {
            var errors,
                _this = this,
                formData,
                isCachedError;

            event.preventDefault();

            formData = Helpers.serializeForm(this.elements.registrationForm) || null;

            if (formData === null) {
                return;
            }

            this.model.set(formData);

            errors = this.model.validate();
            if (errors !== undefined) {
                Helpers.showFieldsErrors(errors, true);
                return;
            }

            isCachedError = this.checkCacheForError(formData);
            if (isCachedError) {
                return;
            }

            this.model.register({
                success: _this.userRegistrationSuccess,
                error: _this.userRegistrationFail
            });
        },

        /**
         * Handler of successful registration
         *
         * @method
         * @name RegistrationView#userRegistrationSuccess
         * @param {Object} response
         * @returns {undefined}
         */
        userRegistrationSuccess: function (response) {
            var app = Soshace.app,
                redirectUrl = response.redirect;

            Soshace.profile = response.profile;
            app.getView('.js-system-messages').collection.fetch().
                done(function () {
                    Backbone.history.navigate(redirectUrl, {trigger: true});
                });
        },

        /**
         * Handler of registration error
         *
         * @method
         * @name RegistrationView#userRegistrationFail
         * @param {Object} response
         * @returns {undefined}
         */
        userRegistrationFail: function (response) {
            var error = Helpers.parseResponseError(response);

            if (error === null) {
                console.error('user registration fail');
                return;
            }

            if (typeof error === 'string') {
                console.error(error);
                return;
            }

            Helpers.showFieldsErrors(error, false);
        },

        /**
         * Focus handler
         *
         * @method
         * @name RegistrationView#focusFormFieldHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        focusFormFieldHandler: function (event) {
            var $target = $(event.target),
                controlStatusData = $target.data('controlStatus'),
                status = controlStatusData.status;

            if (status === 'success') {
                return;
            }

            if (status === 'error') {
                return;
            }

            $target.controlStatus('helper');
        },

        /**
         * Change handler
         *
         * @method
         * @name RegistrationView#changeFormFieldHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        changeFormFieldHandler: function (event) {
            var $target = $(event.target),
                model = this.model,
                serializedField = Helpers.serializeField($target),
                fieldName = serializedField.name,
                fieldValue = serializedField.value,
                setStatusHandler,
                needServerValidation = event.type === 'blur',
                fieldValueNotChanged;

            fieldValueNotChanged = model.get(fieldName) === fieldValue;
            if (fieldValueNotChanged && !needServerValidation) {
                return;
            }

            //TODO: вынести в отдельный метод с сохранением позиции курсора
            //fieldValue = fieldValue.toLowerCase();
            //$target.val(fieldValue);
            model.set(fieldName, fieldValue);
            $target.controlStatus('helper');
            setStatusHandler = this.statusDebounceHandlers[fieldName];

            if (typeof setStatusHandler === 'function') {
                setStatusHandler($target, serializedField, needServerValidation);
            }
        },

        /**
         * Requests server validation for given field
         *
         * @method
         * @param serializedField
         * @param fieldValue
         * @param fieldName
         * @param $field
         * @returns {undefined}
         */
        serverValidation: function(serializedField, fieldValue, fieldName, $field) {
            var model = this.model,
                error,
                self = this;

            model.validateFieldByServer(serializedField).done(function () {
                //В случае, если поле пока шел ответ уже изменилось
                if (fieldValue !== model.get(fieldName)) {
                    return;
                }

                self.setResponseToCache(fieldName, fieldValue, 'success');

                $field.controlStatus('success');
            }).fail(function (response) {
                var errorMessage,
                    responseJSON;

                //В случае, если поле пока шел ответ уже изменилось
                if (fieldValue !== model.get(fieldName)) {
                    return;
                }

                responseJSON = JSON.parse(response.response);
                error = responseJSON.error;
                errorMessage = Helpers.i18n(error.message);

                self.setResponseToCache(fieldName, fieldValue, 'error', errorMessage);

                $field.controlStatus('error', errorMessage);
            });
        },

        /**
         * Method sets status success or error
         *
         * @param $field
         * @param serializedField
         * @param needServerValidation
         */
        setStatus: function ($field, serializedField, needServerValidation) {
            var model = this.model,
                fieldValue = serializedField.value,
                fieldName = serializedField.name,
                error,
                cachedValidationResult;

            if (fieldValue !== model.get(fieldName)) {
                return;
            }

            cachedValidationResult = this.getResponseFromCache(fieldName, fieldValue);
            if (cachedValidationResult !== null) {
                $field.controlStatus(cachedValidationResult.status, cachedValidationResult.message);
                return;
            }

            error = model.preValidate(fieldName, fieldValue);
            if (!_.isEmpty(error)) {
                error = Helpers.i18n(error);
                $field.controlStatus('error', error);
                return;
            }

            if (!needServerValidation) {
                $field.controlStatus('success');
                return;
            }

            this.serverValidation(serializedField, fieldValue, fieldName, $field);
        },

        /**
         * @method
         * @name RegistrationView#serialize
         * @returns {Object}
         */
        serialize: function () {
            var data = this.model.toJSON();

            data.isRegistrationTab = true;
            return data;
        },

        /**
         * Methods shows helpers for fields
         *
         * @method
         * @name RegistrationView#setFieldsHelpers
         * @param {Object} helpers список подсказок
         * @returns {undefined}
         */
        setFieldsHelpers: function (helpers) {
            _.each(helpers, _.bind(function (helper, fieldName) {
                var $field,
                    successTitle = this.model.registrationFormText.successMessages[fieldName];

                fieldName = Helpers.hyphen(fieldName);
                $field = $('#' + fieldName);
                $field.controlStatus({
                    helperTitle: Helpers.i18n(helper),
                    successTitle: Helpers.i18n(successTitle)
                });
            }, this));
        },

        /**
         * Methods cached DOM elements
         *
         * @method
         * @name RegistrationView#setElements
         * @returns {undefined}
         */
        setElements: function () {
            this.elements.registrationForm = this.$('.js-registration-form');
        },

        /**
         * @method
         * @name RegistrationView#afterRender
         * @returns {undefined}
         */
        afterRender: function () {
            this.setElements();
            this.setFieldsHelpers(this.model.registrationFormText.helpers);
            //Используется асинхронный вызов, чтобы навесились обработчики событий
            setTimeout(function () {
                $('#user-name').focus();
            }, 0);
        }
    });
});