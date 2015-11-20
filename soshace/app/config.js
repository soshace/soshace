'use strict';

/**
 * Конфигурация проекта
 */
global.Soshace = {
    /**
     * Указывает среду разработки. Включаем, если производим
     * отладку на локальной машине через IDE
     *
     * @public
     * @constant
     * name soshace.LOCAL_MACHINE
     * @type {Boolean}
     */
    LOCAL_MACHINE: true,

    /**
     * Используемый хост на локальной машине
     *
     * @public
     * @constant
     * @name soshace.LOCAL_HOST
     * @type {String}
     */
    LOCAL_HOST: '10.0.33.34',

    /**
     * @public
     * @constant
     * @name soshace.PRODUCTION_HOST
     * @type {String}
     */
    PRODUCTION_HOST: 'soshace.com',
    /**
     * Версия, берется из package.json
     * Ставится скриптом атоматом
     *
     * @field
     * @name Soshace.VERSION
     * @type {string}
     */
    VERSION: '0',

    /**
     * Путь до корневой директории проекта
     *
     * @field
     * @name Soshace.DIR_NAME
     * @type {string | null}
     */
    DIR_NAME: null,

    /**
     * Окружение
     *
     * @field
     * @name Soshace.IS_PRODUCTION
     * @type {boolean}
     */
    IS_PRODUCTION: true,

    /**
     * хост базы данных
     *
     * @constant
     * @name Soshace.DB_HOST
     * @type {string}
     */
    DB_HOST: 'mongodb://localhost/soshace_db',

    /**
     * Порт который слушает наш node.js сервер
     *
     * @constant
     * @name Soshace.PORT
     * @type {string}
     */
    PORT: '7000',

    /**
     * Хост который слушает наш node.js сервер
     *
     * @constant
     * @name Soshace.HOST
     * @type {string}
     */
    HOST: '0.0.0.0',

    /**
     * Локаль по дефолту
     *
     * @constant
     * @name Soshace.DEFAULT_LOCALE
     * @type {string}
     */
    DEFAULT_LOCALE: 'ru',

    /**
     * Доступные локали
     *
     * @constant
     * @name Soshace.LOCALES
     * @type {String[]}
     */
    LOCALES: [
        'en',
        'ru'
    ],

    /**
     * Полное название локалей
     * Названия должны идти в том же порядке, что и локали
     *
     * @constant
     * @name Soshace.LANGUAGES
     * @type {String[]}
     */
    LANGUAGES: [
        'English',
        'Russian'
    ],

    /**
     * Количество статей на страницу
     *
     * @constant
     * @name Soshace.POSTS_PER_PAGE
     * @type {number}
     */
    POSTS_PER_PAGE: 10,
    /**
     * @constant
     * @name Soshace.MAIL_SERVICE
     * @type {String}
     */
    MAIL_SERVICE: 'yandex',

    /**
     * @constant
     * @name Soshace.MAIL_USER
     * @type {String}
     */
    MAIL_NO_REPLY: 'testov.testin@yandex.ru',

    /**
     * @constant
     * @name Soshace.MAIL_PASSWORD
     * @type {String}
     */
    MAIL_NO_REPLY_PASSWORD: '123123123123',

    /**
     * Ключ сессии
     *
     * @constant
     * @name Soshace.SESSION_KEY
     * @type {String}
     */
    SESSION_KEY: 'session/key',

    /**
     * Список регулярных выражений
     *
     * @constant
     * @name Soshace.PATTERNS
     * @type {Object}
     */
    PATTERNS: {
        email: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
        userName: /^[a-z\.\-_0-9]+$/
    },

    /**
     * Список путей
     *
     * @constant
     * @name Soshace.PATHS
     * @type {Object}
     */
    PATHS: {
        static: '/static/',
        scripts: '/static/scripts/',
        styles: '/static/styles/',
        images: '/static/images/',
        backgrounds: '/static/images/backgrounds/',
        views: '/static/views/',
        profileImages: '/dist/profileImages/'
    },

    /**
     * Метод возвращает директорию для медиа файлов
     *
     * @method
     * @name Soshace.MEDIA_DIRECTORY
     * @returns {String}
     */
    MEDIA_DIRECTORY: function(){
        return this.DIR_NAME + '/media/';
    }
};