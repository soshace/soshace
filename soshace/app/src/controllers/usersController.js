'use strict';
var Controller = srcRequire('common/controller'),
    _ = require('underscore'),
    UsersModel = srcRequire('models/usersModel'),
    PostsModel = srcRequire('models/postsModel'),
    RequestParams = srcRequire('common/requestParams');
/**
 * Контроллер страницы профиля пользователя
 *
 * @class UsersController
 */
module.exports = Controller.extend({

    /**
     * Метод отдает в ответе json с данными профиля
     * пользователя
     *
     * @method
     * @name UsersController#getUser
     * @returns {undefined}
     */
    getUser: function () {
        var response = this.response,
            request = this.request,
            params = request.params,
            userName = params.username,
            requestParams = new RequestParams(request),
            profile;

        if (requestParams.isAuthenticated) {
            profile = requestParams.profile;

            if (userName === profile.userName) {
                profile = profile.getProfileFields();
                response.send(profile);
                return;
            }
        }

        UsersModel.getUserByUserName(userName, _.bind(function (error, user) {
            if (error) {
                this.sendError(error);
                return;
            }

            if (!user) {
                this.sendError('user not fould', 404);
                return;
            }

            user = user.getPublicFields();
            response.send(user);
        }, this));
    },

    /**
     * Метод обновления профиля пользователя
     * В параметрах запроса нужно передавать метод из модели
     * для работы с передаваемыми данными
     * {method: systemMessageDelete}
     *
     * @method
     * @name UsersController#updateUser
     * @returns {undefined}
     */
    updateProfile: function () {
        var response = this.response,
            request = this.request,
            requestParams = new RequestParams(request),
            params = request.params,
            update = request.body,
            userId;

        if (!requestParams.isAuthenticated) {
            this.sendError('User is not authorized.');
            return;
        }

        if (params.username !== requestParams.profile.userName) {
            this.sendError('Forbidden.', 403);
            return;
        }

        userId = requestParams.profile._id;
        UsersModel.updatePersonalData(userId, update, _.bind(function (error) {
            if (error) {
                this.sendError(error);
                return;
            }

            response.send({updated: true});
        }, this));
    },

    /**
     * Метод возвращает True, если редактор профиля или настроек должен быть заблокирован
     *
     * @method
     * @name UsersController#isDisabled
     * @returns {Boolean}
     */
    isDisabled: function () {
        var request = this.request,
            requestParams = new RequestParams(request),
            profile = requestParams.profile;

        if (!requestParams.isAuthenticated) {
            return true;
        }

        return !profile.emailConfirmed;
    },

    /**
     * Метод рендерит страницу редактирования профиля
     *
     * @method
     * @name UsersController#renderUserEditPage
     * @returns {undefined}
     */
    renderUserEditPage: function () {
        var request = this.request,
            params = request.params,
            userName = params.username,
            requestParams = new RequestParams(request),
            profile;

        if (requestParams.isAuthenticated) {
            profile = requestParams.profile;
            if (userName === profile.userName) {
                this.renderProfileEditForAuthenticatedUser(profile);
                return;
            }
        }

        this.renderError('Page not found', 404);
    },

    /**
     * Метод рендерит страницу редактирования профиля
     *
     * @method
     * @name UsersController#renderProfileEditForAuthenticatedUser
     * @param {Mongoose.Model} profile профиль пользователя
     * @returns {undefined}
     */
    renderProfileEditForAuthenticatedUser: function (profile) {
        var request = this.request,
            response = this.response,
            isDisabled = this.isDisabled(),
            sexList = profile.getSexList(),
            requestParams = new RequestParams(request);

        response.render('users/usersEdit', _.extend(requestParams, {
            sexList: sexList,
            user: profile,
            isDisabled: isDisabled,
            isUserEditTab: true,
            isOwner: true,
            title: 'Edit profile'
        }));
    },

    /**
     * Метод рендерит страницу настроек профиля
     *
     * @method
     * @name UsersController#renderUserSettingsPage
     * @returns {undefined}
     */
    renderUserSettingsPage: function () {
        var request = this.request,
            params = request.params,
            userName = params.username,
            requestParams = new RequestParams(request),
            profile;

        if (requestParams.isAuthenticated) {
            profile = requestParams.profile;
            if (userName === profile.userName) {
                this.renderProfileSettingsForAuthenticatedUser(profile);
                return;
            }
        }

        this.renderError('Page not found', 404);
    },

    /**
     * Метод рендерит страницу настроек профиля
     *
     * @method
     * @name UsersController#renderProfileSettingsForAuthenticatedUser
     * @param {Mongoose.Model} profile профиль пользователя
     * @returns {undefined}
     */
    renderProfileSettingsForAuthenticatedUser: function (profile) {
        var request = this.request,
            response = this.response,
            isDisabled = this.isDisabled(),
            requestParams = new RequestParams(request);

        response.render('users/usersSettings', _.extend(requestParams, {
            user: profile,
            isUserSettingsTab: true,
            isDisabled: isDisabled,
            isOwner: true,
            title: 'Settings'
        }));
    },

    /**
     * Метод рендерит страницу пользователя
     *
     * @method
     * @name UsersController#renderLogin
     * @return {undefined}
     */
    renderUserPage: function () {
        var request = this.request,
            params = request.params,
            userName = params.username,
            requestParams = new RequestParams(request),
            profile;

        if (requestParams.isAuthenticated) {
            profile = requestParams.profile;
            if (userName === profile.userName) {
                this.renderProfileForAuthenticatedUser(profile);
                return;
            }
        }

        UsersModel.getUserByUserName(userName, _.bind(function (error, user) {
            if (error) {
                this.renderError(error);
                return;
            }

            if (user === null) {
                this.renderError('User not found', 404);
                return;
            }

            this.renderNotAuthenticatedUserPage(user);
        }, this));
    },

    /**
     * Метод рендерит страницу пользователя
     * Страница не принадлежит текущему пользователю
     *
     * @method
     * @name UsersController#renderAuthenticatedUserPage
     * @param {Mongoose.Model} user
     * @returns {undefined}
     */
    renderNotAuthenticatedUserPage: function (user) {
        var request = this.request,
            response = this.response,
            userId = user._id,
            requestParams = new RequestParams(request);

        PostsModel.getUserPosts(userId, _.bind(function (error, posts) {
            var isProfileInfoEmpty;

            if (error) {
                this.renderError(error);
                return;
            }

            isProfileInfoEmpty = user.isProfileInfoEmpty();
            response.render('users/users', _.extend(requestParams, {
                user: user,
                isProfileInfoEmpty: isProfileInfoEmpty,
                isUserTab: true,
                posts: posts,
                title: 'User Profile'
            }));
        }, this));
    },

    /**
     * Метод рендерит страницу профиля
     * авторизованного пользователя по id профиля
     *
     * @method
     * @name UsersController#renderProfileForAuthenticatedUser
     * @param {Mongoose.Model} profile профиль пользователя
     * @returns {undefined}
     */
    renderProfileForAuthenticatedUser: function (profile) {
        var request = this.request,
            response = this.response,
            profileId = profile._id,
            requestParams = new RequestParams(request);

        PostsModel.getProfilePosts(profileId, _.bind(function (error, posts) {
            var isProfileInfoEmpty;

            if (error) {
                this.renderError(error);
                return;
            }

            isProfileInfoEmpty = profile.isProfileInfoEmpty();
            response.render('users/users', _.extend(requestParams, {
                user: profile,
                isProfileInfoEmpty: isProfileInfoEmpty,
                isUserMainTab: true,
                isOwner: true,
                posts: posts,
                title: 'Profile information'
            }));
        }, this));
    }
});