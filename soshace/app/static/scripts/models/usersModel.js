'use strict';

/**
 * Модель страницы пользователя
 *
 * @class UsersModel
 */

define([
    'zepto',
    'underscore',
    'backbone',
    'utils/helpers',
    'config'
], function ($, _, Backbone, Helpers) {
    return Backbone.Model.extend({

        /**
         * @field
         * @name UsersModel#idAttribute
         * @type {String}
         */
        idAttribute: '_id',

        /**
         * @method
         * @name UsersModel#initialize
         * @returns {string}
         */
        url: function () {
            var userName = this.get('userName');
            return Soshace.urls.api.user.replace('0', userName);
        },

        /**
         * @property
         * @name UsersModel#defaults
         * @type {Object}
         */
        defaults: {
            userName: null,
            locale: null,
            firstName: null,
            lastName: null,
            profileImg: null,
            sex: null,
            aboutAuthor: null,
            email: null,
            password: null
        },

        /**
         * Поля, которые отностятся к информации о профиле
         * По этим полям определятся заполненность профиля
         *
         * @field
         * @name UsersModel#profileInformationFields
         * @type {Array}
         */
        profileInformationFields: [
            'firstName',
            'lastName',
            'profileImg',
            'sex',
            'birthday',
            'aboutAuthor'
        ],

        /**
         * Список полов
         *
         * @field
         * @name UsersModel#sexList
         * @type {Array}
         */
        sexList: [
            {
                title: 'Male',
                value: 'male',
                selected: true
            },
            {
                title: 'Female',
                value: 'female',
                selected: false
            }
        ],

        registrationFormText: {
            helpers: {
                userName: 'Use the Latin alphabet, numbers, &#34;.&#34;, &#34;_&#34;, &#34;-&#34;.',
                email: 'Please enter your e-mail address.',
                password: 'Use the numbers, upper-and lowercase letters, symbols'
            },
            successMessages: {
                userName: 'Great username!',
                email: 'Great email!',
                password: 'Great password!'
            }
        },

        validation: {
            email: [
                {
                    required: true,
                    msg: 'Email can&#39;t be blank.'
                },
                {
                    pattern: Soshace.patterns.email,
                    msg: 'Email is invalid.'
                }
            ],
            password: [
                {
                    required: true,
                    msg: 'Password can&#39;t be blank.'
                },
                {
                    minLength: 6,
                    msg: 'Password length should&#39;t be less than 6 characters.'
                }
            ],
            userName: [
                {
                    required: true,
                    msg: 'Username can&#39;t be blank.'
                },
                {
                    userName: 1
                }
            ]
        },

        /**
         * Gets fields needed for registration from model to reduce traffic
         * server don't need whole model
         *
         * @method
         * @name UsersModel#getRegistrationData
         * @returns {Object}
         */
        getRegistrationData: function() {
            return {
                locale: this.get('locale'),
                email: this.get('email'),
                password: this.get('password'),
                userName: this.get('userName')
            };
        },

        /**
         * Sends request to register user
         *
         * @method
         * @name UsersModel#register
         * @param callbacks
         * @returns {undefined}
         */
        register: function(callbacks) {
            $.ajax({
                type: "POST",
                url: Soshace.urls.api.createUser,
                dataType: 'json',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(this.getRegistrationData()),
                success: callbacks.success,
                error: callbacks.error
            });
        },

        /**
         * Method returns true if profile is empty
         *
         * @method
         * @name UsersModel#isProfileInfoEmpty
         * @returns {Boolean}
         */
        isProfileInfoEmpty: function () {
            var profileInformationFields = this.profileInformationFields,
                fieldsLength = profileInformationFields.length,
                fieldName,
                i;

            for (i = 0; i < fieldsLength; i++) {
                fieldName = profileInformationFields[i];
                if (this.get(fieldName) !== null) {
                    return false;
                }
            }
            return true;
        },

        /**
         * Method loads user's data
         *
         * @method
         * @name UsersModel#getUser
         * @returns {jQuery.Deferred}
         */
        getUser: function () {
            var deferred = $.Deferred(),
                userName = this.get('userName'),
                profileUserName = '',
                profile = Soshace.profile;

            if (profile !== null) {
                profileUserName = profile.userName;

                if (profileUserName === userName) {
                    this.set(profile);
                    return deferred.resolve(profile);
                }
            }

            return this.fetch();
        },

        /**
         * Sends request to login user
         *
         * @method
         * @name UsersModel#login
         * @param loginData
         * @param callbacks
         * @returns {undefined}
         */
        login: function(loginData, callbacks) {
            $.ajax({
                type: "POST",
                url: Soshace.urls.api.login,
                dataType: 'json',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(loginData),
                success: callbacks.success,
                error: callbacks.error
            });
        },

        /**
         * Метод возвращает список полов с выбранным в модели полом
         *
         * @method
         * @name UsersModel#getSexList
         * @returns {Array}
         */
        getSexList: function () {
            var currentSex = this.get('sex');

            if (currentSex === null) {
                return this.sexList;
            }

            _.each(this.sexList, function (sex) {
                var isCurrentSex = sex.value === currentSex;
                sex.selected = isCurrentSex;
            });

            return this.sexList;
        },

        /**
         * Makes request to server to update password and passes response to callback
         *
         * @method
         * @param {String} oldPassword
         * @param {String} password
         * @param {Function} callbacks
         * @returns {undefined}
         */
        updatePassword: function (oldPassword, password, callbacks) {
            $.ajax({
                type: "POST",
                url: Soshace.urls.api.updatePassword,
                dataType: 'json',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    password: password,
                    oldPassword: oldPassword
                }),
                success: callbacks.success,
                error: callbacks.error
            });
        },

        /**
         * Sends request to server to reset password
         *
         * @method
         * @name UsersModel#resetPassword
         * @param resetPasswordData
         * @param callbacks
         * @returns {undefined}
         */
        resetPassword: function(resetPasswordData, callbacks) {
            $.ajax({
                type: "POST",
                url: Soshace.urls.api.resetPassword,
                dataType: 'json',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(resetPasswordData),
                success: callbacks.success,
                error: callbacks.error
            });
        },

        /**
         * Method sends request to validate field by server
         *
         * @method
         * @name UsersModel#validation
         * @param {Object} serializedField
         * @returns {jQuery.Deferred}
         */
        validateFieldByServer: function (serializedField) {
            var params = {},
                name = serializedField.name;

            params[name] = serializedField.value;
            // use post for security
            return $.post(Soshace.urls.api.registration.validateField, params);
        },

        /**
         * Sends request to remind password
         *
         * @method
         * @name Usersmodel@remindPassword
         * @param emailValue
         * @param callbacks
         * @returns {undefined}
         */
        remindPassword: function(emailValue, callbacks) {
            $.ajax({
                type: "POST",
                url: Soshace.urls.api.remindPassword.send,
                dataType: 'json',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    email: emailValue
                }),
                success: callbacks.success,
                error: callbacks.error
            });
        },

        /**
         * @constructor
         * @name UsersModel#initialize
         * @returns {undefined}
         */
        initialize: function () {
            var locale = Helpers.getLocale();
            this.set({locale: locale}, {silent: true});
        }
    });
});