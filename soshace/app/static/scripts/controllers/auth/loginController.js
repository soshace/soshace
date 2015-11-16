'use strict';

/**
 * Контроллер страницы логина
 *
 * @class LoginController
 */
define([
    'backbone',
    'utils/controller',
    'models/usersModel',
    'views/auth/loginView',
    'utils/helpers'
],
    function (Backbone, Controller, UsersModel, LoginView, Helpers) {
        return Controller.extend({
            /**
             * Алиас страницы
             *
             * @field
             * @name LoginController#pageAlias
             * @type {String}
             */
            pageAlias: 'login',

            /**
             * @field
             * @name LoginController#model
             * @type {UsersModel}
             */
            model: null,

            /**
             * @field
             * @name LoginController#view
             * @type {LoginView}
             */
            view: null,

            /**
             * @constructor
             * @name LoginController#initialize
             * @returns {undefined}
             */
            initialize: function () {
                this.model = new UsersModel();
                this.view = new LoginView({
                    model: this.model
                });
            },


            /**
             * Метод вызывает при рендере на сервере
             *
             * @method
             * @name LoginController#firstLoad
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
             * @name LoginController#firstLoad
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
                    return;
                }

                this.view = view;
                app.setView('.js-content', view).render();
            }
        });
    });