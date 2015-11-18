'use strict';

/**
 * Вид страницы редактирования пользователя
 *
 * @class UsersEditView
 */

define([
    'zepto',
    'underscore',
    'backbone',
    'handlebars',
    'utils/helpers',
    'backbone.layoutmanager',
    'templates',
    'utils/plugins/jquery.calendar'
], function ($, _, Backbone, Handlebars, Helpers) {
    return Backbone.Layout.extend({
        /**
         * Модель деталей статьи
         *
         * @field
         * @name UsersEditView#model
         * @type {Backbone.Model | null}
         */
        model: null,

        /**
         * Ссылки на DOM элементы
         *
         * @field
         * @name UsersEditView#elements
         * @type {Object}
         */
        elements: {
            saveMessages: null,
            birthday: null,
            form: null
        },

        /**
         * Список обработчиков событий
         *
         * @field
         * @name UsersEditView#events
         * @type {Object}
         */
        events: {
            'submit': 'submitHandler',
            'click .js-save-messages .close': 'closeSaveMessage'
        },

        /**
         * Путь до шаблона
         *
         * @field
         * @name UsersEditView#elements
         * @type {string}
         */
        template: Soshace.hbs['users/usersEdit'],

        /**
         * @constructor
         * @name UsersEditView#initialize
         * @returns {undefined}
         */
        initialize: function () {
            Handlebars.registerPartial(
                'usersTabs',
                Soshace.hbs['partials/usersTabs']
            );
            Handlebars.registerPartial(
                'jquery/calendar/calendar',
                Soshace.hbs['partials/jquery/calendar/calendar']
            );
        },

        /**
         * Метод блокирует форму
         *
         * @method
         * @name UsersEditView#formDisabled
         * @returns {undefined}
         */
        formDisabled: function () {

        },

        /**
         * Метод разблокирует форму
         *
         * @method
         * @name UsersEditView#formEnabled
         * @returns {undefined}
         */
        formEnabled: function () {

        },

        /**
         * Метод показывает лоадер на кнопке
         *
         * @method
         * @name UsersEditView#showButtonLoader
         * @returns {undefined}
         */
        showSubmitButtonLoader: function () {

        },

        /**
         * Метод скрывает лоадер
         *
         * @method
         * @name UsersEditView#hideSubmitButtonLoader
         * @returns {undefined}
         */
        hideSubmitButtonLoader: function () {

        },

        /**
         * Метод устанавливает данные в модель взятые из шаблона
         *
         * @method
         * @name UsersEditView#setModelFromTemplate
         * @returns {undefined}
         */
        setModelFromTemplate: function () {
            var $form = this.elements.form,
                userData = $form.data();

            this.model.set(userData);
        },

        /**
         * Form submit handler
         *
         * @method
         * @name UsersEditView#submitHandler
         * @param {jQuery.Event} event
         * @returns {undefined}
         */
        submitHandler: function (event) {
            var formData = Helpers.getFormData(this.elements.form),
                diff;

            event.preventDefault();

            formData.birthday = this.elements.birthday.calendar('getOptions').selectedDate;
            this.model.set(formData);
            diff = this.model.changed;

            if (_.isEmpty(diff)) {
                return;
            }

            this.formDisabled();
            this.showSubmitButtonLoader();
            Soshace.profile = this.model.toJSON();
            this.model.save(diff, {
                patch: true,
                success: _.bind(this.submitSuccessHandler, this),
                error: _.bind(this.submitErrorHandler, this)
            });
        },

        /**
         * Метод показывает системное сообщение после отправки формы
         *
         * @method
         * @name UsersEditView#showSaveMessage
         * @param {String} message
         * @param {Boolean} [isError] true, если нужно показать ошибку
         * @returns {undefined}
         */
        showSaveMessage: function (message, isError) {
            var $saveMessages = this.elements.saveMessages,
                template;

            if (isError) {
                template = Soshace.hbs['messages/errorMessage']({
                    message: message
                });
            } else {
                template = Soshace.hbs['messages/successMessage']({
                    message: message
                });
            }

            $saveMessages.html(template).removeClass('hide');
            Helpers.scrollToElementTop($saveMessages);
        },

        /**
         * Метод скрывает системное сообщение после отправки формы
         *
         * @method
         * @name UsersEditView#hideSaveMessage
         * @returns {undefined}
         */
        hideSaveMessage: function () {
            this.elements.saveMessages.addClass('hide');
        },

        /**
         * Метод обработчик успешного сохранения данных пользователя
         *
         * @method
         * @name UsersEditView#submitSuccessHandler
         * @returns {undefined}
         */
        submitSuccessHandler: function () {
            this.hideSubmitButtonLoader();
            this.formEnabled();
            this.showSaveMessage('Profile successfully updated');
        },

        /**
         * Метод обработчик неудачного сохранения данных пользователя
         *
         * @method
         * @name UsersEditView#submitErrorHandler
         * @param {UserModel} model модель пользователя
         * @param {Object} response ответ сервера
         * @returns {undefined}
         */
        submitErrorHandler: function (model, response) {
            var responseData = JSON.parse(response.responseText),
                error = responseData.error;

            this.hideSubmitButtonLoader();
            this.formEnabled();
            this.showSaveMessage(error, true);
        },

        /**
         * Метод используется в тех случаях, когда шаблон уже отрендерен
         * Но надо навесить слушатели и выполнить afterRender и т.д.
         *
         * @method
         * @name UsersEditView#withoutRender
         * @param {jQuery} $el родительский элемент вида
         * @returns {undefined}
         */
        withoutRender: function ($el) {
            this.$el = $el;
            this.delegateEvents();
            this.setElements();
            this.setModelFromTemplate();
            this.model.getUser();
            this.setDatesControls();
        },

        /**
         * Метод возвращает True, если страница должна быть заблокирована
         * Если пользователь не авторизован или у пользователя не подтвержден email
         * см. Wiki
         *
         * @method
         * @name UsersEditView#isDisabled
         * @returns {Boolean}
         */
        isDisabled: function () {
            var app = Soshace.app,
                isAuthenticated = app.isAuthenticated(),
                profile;

            if (!isAuthenticated) {
                return true;
            }

            profile = Soshace.profile;
            return !profile.emailConfirmed;
        },

        /**
         * Method closes system messages on click on close button
         *
         * @method
         * @name UsersEditView#closeSaveMessage
         * @param e
         * @returns {undefined}
         */
        closeSaveMessage: function(e) {
            $(e.currentTarget).parent().remove();
        },

        /**
         * @method
         * @name UsersEditView#serialize
         * @returns {Object}
         */
        serialize: function () {
            var app = Soshace.app,
                isAuthenticated = app.isAuthenticated(),
                data = {},
                model = this.model.toJSON(),
                profile = Soshace.profile,
                isOwner = isAuthenticated && model._id === profile._id;

            data.user = model;
            data.isOwner = isOwner;
            data.isUserEditTab = true;
            data.locale = Helpers.getLocale();
            data.sexList = this.model.getSexList();
            data.isDisabled = this.isDisabled();

            return data;
        },

        /**
         * Метод сохраняет DOM элементы
         *
         * @method
         * @name UsersEditView#setElements
         * @returns {undefined}
         */
        setElements: function () {
            this.elements.form = this.$('.js-form');
            this.elements.saveMessages = this.$('.js-save-messages');
            this.elements.birthday = this.$('.js-birthday-calendar');
        },

        /**
         * Method initializes calendar plugin
         *
         * @method
         * @name UsersEditView#setDatesControls
         * @returns {undefined}
         */
        setDatesControls: function () {
            this.elements.birthday.calendar({
                selectedDate: this.model.get('birthday')
            });
        },

        /**
         * @method
         * @name UsersEditView#afterRender
         * @returns {undefined}
         */
        afterRender: function () {
            this.setElements();
            this.setDatesControls();
        }
    });
});