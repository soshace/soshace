'use strict';
var Controller = srcRequire('common/controller'),
    PostsModel = srcRequire('models/postsModel'),
    _ = require('underscore'),
    RequestParams = srcRequire('common/requestParams');

/**
 * Контроллер, отвечающий за редактирование/добавление статьи
 *
 * @class PostEditController
 *
 */
module.exports = Controller.extend({
    /**
     * Список полей, которые можно сохранить
     *
     * @field
     * @name PostEditController#fieldsCanBeSaved
     * @type {Array}
     */
    fieldsCanBeSaved: [
        'ownerId',
        'locale',
        'title',
        'category',
        'tags',
        'description',
        'body'
    ],

    /**
     * Обрабатываем запрос на добавление поста
     *
     * @public
     * @method
     * @name PostEditController#createPost
     * @return {undefined}
     */
    createPost: function () {
        var request = this.request,
            postData = request.body,
            requestParams = new RequestParams(request),
            profile,
            post;

        if (!postData) {
            this.sendError('Bad request');
            return;
        }

        if (!requestParams.isAuthenticated) {
            this.sendError('Unauthorized', 401);
            return;
        }

        profile = requestParams.profile;
        postData.ownerId = profile._id;
        postData.locale = profile.locale;
        postData = _.pick(postData, this.fieldsCanBeSaved);
        post = new PostsModel(postData);
        post.save(_.bind(this.postSaveHandler, this));
    },

    /**
     * Метод обновляет модель статьи
     *
     * @method
     * @name PostEditController#updatePost
     * @returns {undefined}
     */
    updatePost: function () {
        var request = this.request,
            response = this.response,
            params = request.params,
            postId = params._id,
            update = request.body,
            requestParams = new RequestParams(request),
            profile;

        if (typeof postId === 'undefined') {
            this.sendError('Bad request.');
            return;
        }

        if (!requestParams.isAuthenticated) {
            this.sendError('Unauthorized', 401);
            return;
        }

        profile = requestParams.profile;
        PostsModel.updatePost(postId, profile, update, _.bind(function (error) {
            if (error) {
                this.sendError(error);
                return;
            }

            response.send({updated: true});
        }, this));
    },

    /**
     * Метод обработчик сохранения поста в базе
     *
     * @method
     * @name PostEditController#postSaveHandler
     * @param {Object} error объект ошибки
     * @param {PostsModel} post модель статьи
     * @returns {undefined}
     */
    postSaveHandler: function (error, post) {
        var response = this.response;

        if (error) {
            if (error.errors) {
                //TODO: доработать отображение ошибок
                this.sendError(error.errors);
                return;
            }

            this.sendError('Server is too busy, try later', 503);
            return;
        }

        response.send({created: true, post: post});
    },

    /**
     * Метод возвращает True, если редактор должен быть заблокирован
     *
     * @method
     * @name PostEditController#isEditorDisabled
     * @returns {Boolean}
     */
    isEditorDisabled: function () {
        var request = this.request,
            requestParams = new RequestParams(request),
            profile = requestParams.profile;

        if (!requestParams.isAuthenticated) {
            return true;
        }

        return !profile.emailConfirmed;
    },

    /**
     * TODO: доделать
     *
     * Метод редерит страницу редактировиания/добавления статьи
     *
     * @method
     * @name PostEditController#renderEditPost
     * @returns {undefined}
     */
    renderEditPost: function () {
        var request = this.request,
            response = this.response,
            requestParams = new RequestParams(request),
            locale = requestParams.locale,
            params = request.params,
            postId = params && params._id,
            notAuthenticated = !requestParams.isAuthenticated,
            redirectUrl;

        if (notAuthenticated) {
            if (postId) {
                redirectUrl = '/' + locale + '/posts/new';
                response.redirect(redirectUrl);
                return;
            }

            this.renderNewEditPost();
            return;
        }

        this.renderEditPostForAuthenticated();
    },

    /**
     * Метод рендерит страницу редактирования статьи для
     * авторизованного пользователя
     *
     * @method
     * @name PostEditController#renderEditPostForAuthenticated
     * @returns {undefined}
     */
    renderEditPostForAuthenticated: function () {
        var request = this.request,
            requestParams = new RequestParams(request),
            params = request.params,
            postId = params && params._id,
            profile = requestParams.profile,
            profileId = profile && profile._id;

        if (postId) {
            PostsModel.getProfilePost(postId, profileId,
                _.bind(this.renderEditPostForAuthenticatedHandler, this));
            return;
        }

        this.renderNewEditPost();
    },

    /**
     * Метод рендерит страницу редактирования статьи для
     * авторизованного пользователя
     *
     * Callback получения статьи из базы
     *
     * @method
     * @name PostEditController#renderEditPostForAuthenticatedHandler
     * @param {String} error текст ошибки
     * @param {Backbone.Model} post модель статьи
     * @returns {undefined}
     */
    renderEditPostForAuthenticatedHandler: function (error, post) {
        var response = this.response,
            request = this.request,
            editorDisabled = false,
            isReadOnly = this.isReadOnly(post),
            requestParams = new RequestParams(request);

        if (error) {
            this.renderError(error);
            return;
        }

        if (post === null) {
            this.renderNewEditPost();
            return;
        }

        response.render('posts/edit/postEdit', _.extend(requestParams, {
            title: 'Edit Post',
            post: post,
            readOnly: isReadOnly,
            isNew: false,
            editorDisabled: editorDisabled,
            isPostEditTab: true
        }));
    },

    /**
     * Метод возвращает true, если статья только для чтения
     * Для статусов лпубликована и отправлена
     * См. wiki
     *
     * @method
     * @name PostEditController#isReadOnly
     * @param {PostsModel} post
     * @returns {boolean}
     */
    isReadOnly: function (post) {
        var status = post.status;

        return status === 'sent' || status === 'published';
    },

    /**
     * Метод рендерит новую страницу редактора
     *
     * @method
     * @name PostEditController#renderNewEditPost
     * @returns {undefined}
     */
    renderNewEditPost: function () {
        var request = this.request,
            response = this.response,
            requestParams = new RequestParams(request);

        response.render('posts/edit/postEdit', _.extend(requestParams, {
            title: 'Edit Post',
            isPostEditTab: true,
            isNew: true,
            editorDisabled: this.isEditorDisabled()
        }));
    }
});