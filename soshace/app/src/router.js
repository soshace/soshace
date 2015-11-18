'use strict';

var _ = require('underscore'),
    Class = srcRequire('vendors/class');

module.exports = Class.extend({
    /**
     * Префикс для путей к контроллерам
     *
     * @field
     * @name Router#controllersPrefix
     * @type {String}
     */
    controllersPrefix: './controllers/',

    /**
     * Ссылка на приложение
     *
     * @field
     * @name Router#app
     * @type {Object}
     */
    app: null,

    /**
     * Список контроллеров
     *
     * @field
     * @name Router#controllers
     * @type {Object}
     */
    controllers: null,

    /**
     * example {'post /api/create': 'posts/postsController create'}
     * example {'get /api/get_user': 'userController get'}
     *
     * 1 Тип запроса: GET, POST, PUT, DELETE
     * 2 Путь запроса
     * 3 Путь до контроллера
     * 4 Метод контроллера
     *
     * @field
     * @name Router#routes
     * @type {Object}
     */
    routes: {
        //-----------------API start------------------
        'post /api/images': 'imageController createImage',
        'get /api/posts': 'posts/postsController getPosts',
        'get /api/posts/:_id': 'posts/postsController getPost',
        'patch /api/posts/:_id': 'posts/postEditController updatePost',
        'delete /api/posts/:_id': 'posts/postsController removePost',
        'post /api/posts': 'posts/postEditController createPost',
        'post /api/users': 'auth/registrationController createUser',
        'get /api/users/:username': 'usersController getUser',
        'patch /api/users/:username': 'usersController updateProfile',
        'delete /api/users/:username': 'usersController removeProfile',
        'post /api/login': 'auth/loginController loginHandler',
        'get /api/logout': 'auth/loginController logoutHandler',
        'post /api/registration/validate': 'auth/registrationController validateField',
        'post /api/remind_password': 'auth/remindPasswordController remindPasswordHandler',
        'get /api/system_messages': 'systemMessagesController getMessages',
        'delete /api/system_messages/:_id': 'systemMessagesController removeMessage',
        'patch /api/system_messages/:_id': 'systemMessagesController updateMessage',
        'post /api/reset-password': 'auth/remindPasswordController changePassword',
        'post /api/update-password': 'auth/remindPasswordController updatePassword',
        'post /api/users/:username': 'usersController uploadProfileImage',
        //-------------------API end--------------------

        'get /': 'posts/postsController redirectToPosts',
        'get /:locale': 'posts/postsController renderPosts',
        'get /:locale/posts': 'posts/postsController renderPosts',
        'get /:locale/posts/new': 'posts/postEditController renderEditPost',
        'get /:locale/posts/:_id/edit': 'posts/postEditController renderEditPost',
        'get /:locale/posts/:_id': 'posts/postsController renderPost',
        'get /:locale/registration': 'auth/registrationController renderRegistration',
        'get /:locale/login': 'auth/loginController renderLogin',
        'get /:locale/remind_password': 'auth/remindPasswordController renderRemindPasswordPage',
        'get /:locale/reset-password': 'auth/remindPasswordController resetPassword',
        'get /:locale/users/:username': 'usersController renderUserPage',
        'get /:locale/users/:username/edit': 'usersController renderUserEditPage',
        'get /:locale/users/:username/settings': 'usersController renderUserSettingsPage',
        'get /:locale/registration/confirm_email': 'auth/registrationController confirmEmail',
        'get /:locale/admin': 'admin/adminController renderAdmin',
        'get /:locale/posts/:_id/review': 'admin/adminController renderPostReview',
        'get /*': 'errorsController render404'
    },


    /**
     * @constructor
     * @name Router#initialize
     * @returns {undefined}
     */
    initialize: function (app) {
        this.app = app;
        this.controllers = {};
        this.parseRoutes();
    },

    /**
     * Метод возвращает контроллер по пути
     *
     * @method
     * @name Router#getController
     * @param {String} path путь до контроллера
     * @returns {Object}
     */
    getController: function (path) {
        var prefix = this.controllersPrefix,
            fullPath = prefix + path,
            controllers = this.controllers,
            controller = controllers[path];

        if (controller) {
            return controller;
        }

        controller = controllers[path] = require(fullPath);
        return controller;
    },

    /**
     * Метод разбирает роуты
     *
     * example {'post /api/create': 'posts/postsController create'}
     * example {'get /api/get_user': 'userController get'}
     *
     * @method
     * @name Router#initialize
     * @returns {undefined}
     */
    parseRoutes: function () {
        var app = this.app,
            routes = this.routes;

        _.each(routes, _.bind(function (controller, route) {
            var controllerData = controller.match(/[^\s]+/g),
                controllerPath = controllerData[0],
                controllerMethod = controllerData[1],
                routeData = route.match(/[^\s]+/g),
                requestType = routeData[0],
                requestPath = routeData[1];

            app[requestType](requestPath, _.bind(function (request, response, next) {
                var Controller = this.getController(controllerPath),
                    controller = new Controller(request, response, next);

                controller[controllerMethod]();
            }, this));
        }, this));
    }

});