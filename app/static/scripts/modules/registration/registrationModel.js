'use strict';

/**
 * Модель страницы регистрации
 *
 * @module RegistrationModel
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {
    return Backbone.Model.extend({
        /**
         * @field
         * @name RegistrationModel#defaults
         * @type {Object}
         */
        defaults: {
            locale: null,
            email: null,
            fullName: null,
            password: null,
            userName: null
        },

        /**
         * @field
         * @name RegistrationModel#validation
         * @type {Object}
         */
        validation: {
            userName: {
                required: true,
                msg: 'Please enter an username'
            },
            fullName: {
                required: true,
                msg: 'Please enter a full name'
            },
            email: [
                {
                    required: true,
                    msg: 'Please enter an<br/> email address'
                },
                {
                    pattern: 'email',
                    msg: 'Please enter a valid email'
                }
            ],
            password: [
                {
                    required: true,
                    msg: 'Please enter a password'
                }
            ]
        },

        /**
         * Список подсказок к полям
         *
         * @field
         * @name RegistrationModel#helpers
         * @type {Object}
         */
        helpers: {
            userName: 'user name',
            fullName: 'Please enter a full name',
            email: 'Please enter an<br/> email address',
            password: 'Please enter a password'
        },

        /**
         * @field
         * @name RegistrationModel#url
         * @type {string}
         */
        url: '/api/create_user',

        /**
         * @constructor
         * @name RegistrationModel#initialize
         * @param {Object} params
         * @returns {undefined}
         */
        initialize: function (params) {
            this.set({locale: params.locale}, {silent: true});
        }
    });
});