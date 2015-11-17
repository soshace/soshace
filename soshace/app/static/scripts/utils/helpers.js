'use strict';

/**
 * Модуль содержащий удобные методы для
 * работы с DOM, стороками и числами
 *
 * @module Helpers
 */

define([
    'zepto',
    'underscore',
    'jquery.cookie',
    'config'
], function ($, _) {
    return {
        /**
         * hyp-hen string to camelCase
         *
         * @public
         * @method
         * @name Helpers.camelCase
         * @param {String} value
         * @returns {string}
         */
        camelCase: function (value) {
            return $.camelCase(value);
        },

        /**
         * camelCase string to hyp-hen
         *
         * @public
         * @method
         * @name Helpers.camelCase
         * @param {String} value
         * @returns {string}
         */
        hyphen: function (value) {
            return value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        },

        /**
         * Метод возвращает сериализованную фому в виде объекта
         * {name1: value1, name2: value2}
         *
         * @public
         * @method
         * @name Helpers.serializeForm
         * @param {jQuery} $form
         * @returns {Object}
         */
        serializeForm: function ($form) {
            var formArray = $form.serializeArray(),
                serializedForm = {};

            _.each(formArray, function (field) {
                serializedForm[field.name] = field.value;
            });

            return serializedForm;
        },

        /**
         * Method parses error from server response
         *
         * @method
         * @name Helpers#parseResponseError
         * @param {Object} response
         * @returns {Object | null}
         */
        parseResponseError: function (response) {
            var error,
                responseJSONError;

            if (!response) {
                return null;
            }

            responseJSONError = response.responseJSON && response.responseJSON.error;
            if (responseJSONError) {
                return responseJSONError;
            }

            try {
                error = JSON.parse(response.responseText);
                if (error.error) {
                    error = error.error;
                }
            }  catch(e) {
                error = null;
            }

            return error;
        },

        /**
         * Method shows errors list in specified fields
         *
         * @method
         * @name Helpers#showFieldsErrors
         * @param {Object} errors list of errors
         * @param {boolean} translate
         * @returns {undefined}
         */
        showFieldsErrors: function (errors, translate) {
            _.each(errors, _.bind(function (error, fieldName) {
                var $field;

                fieldName = this.hyphen(fieldName);
                $field = $('#' + fieldName);
                if (translate) {
                    error = this.i18n(error);
                }
                $field.controlStatus('error', error);
            }, this));
        },

        /**
         * Gets validation error for formData
         *
         * @method
         * @name Helpers#getValidationError
         * @param formData
         * @param model
         * @returns {Object || null}
         */
        getValidationError: function(formData, model) {
            var validationError = _.reduce(formData, function(errors, fieldValue, fieldName) {
                var fieldError = model.preValidate(fieldName, fieldValue);
                if (!_.isEmpty(fieldError)) {
                    errors[fieldName] = fieldError;
                }
                return errors;
            }, {}, this);

            return _.isEmpty(validationError)? null: validationError;
        },

        /**
         * Метод возвращает сериализованный инпут
         *
         * @public
         * @method
         * @name Helpers.serializeField
         * @param {jQuery} $input
         * @returns {Object}
         */
        serializeField: function ($input) {
            var value = $input.val(),
                name = $input.attr('name'),
                _this = this;

            return {
                name: _this.camelCase(name),
                value: $.trim(value)
            };
        },

        /**
         * Получаем локаль
         *
         * @public
         * @method
         * @name Helpers.getLocale
         * @return {String}
         */
        getLocale: function () {
            return $.cookie('locale') || 'en';
        },

        /**
         * Метод переводит переданныу строку
         *
         * @public
         * @method
         * @name Helpers.i18n
         * @returns {String}
         */
        i18n: function () {
            var params = arguments,
                value = params[0],
                locale = this.getLocale(),
                translations = Soshace.locales[locale];

            //If value consists params for translation
            if (value instanceof Array) {
                params = value;
                value = params[0];
            }

            Array.prototype.shift.call(params);

            if (typeof translations === 'undefined') {
                return this._i18nSetParams(value, params);
            }

            if (typeof translations[value] === 'undefined') {
                return this._i18nSetParams(value, params);
            }

            return this._i18nSetParams(translations[value], params);
        },

        /**
         * Method returns serialized form
         *
         * @method
         * @name Helpers#getFormData
         * @returns {Object}
         */
        getFormData: function ($form) {
            var serializedForm = $form.serializeArray();
            return _.object(_.map(serializedForm, function (field) {
                return [field.name, field.value];
            }));
        },

        /**
         * Метод вставляет в строку переменные из списка опций
         * Заменяет {{param}}
         *
         * @private
         * @method
         * @name Helpers._i18nSetParams
         * @param {String} value строка перевода
         * @param {Array} optionsList список опций
         * @returns {String}
         */
        _i18nSetParams: function (value, optionsList) {
            var stringParams = value.match(/\{\{(.+?)\}\}/g);

            _.each(stringParams, function (param, index) {
                value = value.replace(param, optionsList[index]);
            });

            return value;
        },

        /**
         * Метод возвращает true, если есть поддержка History API
         *
         * @public
         * @method
         * @name Helpers.checkHistoryApiSupport
         * @returns {boolean}
         */
        checkHistoryApiSupport: function () {
            return !!(window.history && history.pushState);
        },

        /**
         * Метод прокручивает до верхнего края элемента + 10px, чтобы
         * элемент было хорошо видно
         *
         * @public
         * @method
         * @name Helpers.scrollToElementTop
         * @param {jQuery} $element
         * @returns {undefined}
         */
        scrollToElementTop: function ($element) {
            var offset = $element.offset(),
                top = offset.top - 10;

            window.scrollTo(0, top);
        },

        /**
         * Форматируем числа к виду '01'
         *
         * @public
         * @method
         * @name Helpers.zeroLeading
         * @param {Number|String} numberToFormat
         * @returns {String}
         */
        zeroLeading: function (numberToFormat) {
            numberToFormat = String(numberToFormat);
            if (numberToFormat && numberToFormat.length) {
                if (numberToFormat.length === 1) {
                    return '0' + numberToFormat;
                }
                return numberToFormat;
            }
            return '00';
        }
    };
});