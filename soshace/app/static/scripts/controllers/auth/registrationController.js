'use strict';

/**
 * Контроллер страницы регистрации
 *
 * @class RegistrationController
 */
define([
    'backbone',
    'utils/controller',
    'models/usersModel',
    'views/auth/registrationView',
    'utils/helpers',
    'config'
],
    function (Backbone, Controller, UsersModel, RegistrationView, Helpers) {
        return Controller.extend({
            /**
             * Алиас страницы
             *
             * @field
             * @name RegistrationController#pageAlias
             * @type {String}
             */
            pageAlias: 'registration',

            /**
             * @field
             * @name RegistrationController#model
             * @type {UsersModel}
             */
            model: null,

            /**
             * @field
             * @name RegistrationController#view
             * @type {RegistrationView}
             */
            view: null,

            /**
             * @constructor
             * @name RegistrationController#initialize
             * @returns {undefined}
             */
            initialize: function () {
                this.model = new UsersModel();
                this.view = new RegistrationView({
                    model: this.model
                });
            },


            /**
             * Метод вызывает при рендере на сервере
             *
             * @method
             * @name RegistrationController#firstLoad
             * @returns {undefined}
             */
            firstLoad: function () {
                var app = Soshace.app,
                    view = this.view;

                view.$el = app.elements.contentFirstLoad;
                view.delegateEvents();
                view.afterRender();
            },

            /**
             * Метод вызывает при рендере на клиенте
             *
             * @method
             * @name RegistrationController#firstLoad
             * @returns {undefined}
             */
            secondLoad: function () {
                var locale,
                    userName,
                    view = this.view,
                    app = Soshace.app;

                if (app.isAuthenticated()) {
                    locale = Helpers.getLocale();
                    userName = Soshace.profile.userName;
                    Backbone.history.navigate('/' + locale + '/users/' + userName);
                }

                this.view = view;
                app.setView('.js-content', view).render();
            }
        });
    });