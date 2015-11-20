'use strict';

//Импортируем глобальный объект soshace
require('./app/config');

global.srcRequire = function (name) {
    return require(__dirname + '/app/src/' + name);
};

var _ = require('underscore'),
    express = require('express'),
    Package = require('./package'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    App = express(),
    DbConnection = srcRequire('common/dbConnection'),
    I18n = require('i18n-2'),
    Router = srcRequire('router'),
    Passport = require('passport'),
    Handlebars = require('express3-handlebars'),
    Strategies = srcRequire('common/strategies'),
    Class = srcRequire('vendors/class'),
    methodOverride = require('method-override'),
    SystemMessagesController = srcRequire('controllers/systemMessagesController'),
    MongoStore = require('connect-mongo')(session);

var Blog = Class.extend({
    /**
     * Инициализируем приложение
     *
     * @private
     * @function
     * @name Blog.initialize
     * @return {undefined}
     */
    initialize: function () {
        Soshace.DIR_NAME = __dirname;
        Soshace.VERSION = Package.version;
        Soshace.IS_PRODUCTION = App.get('env') === 'production';
        this.configure();
        //Подрубаемся к базе
        DbConnection.databaseOpen(_.bind(function () {
            Strategies.localStrategy();
            new Router(App);
            App.listen(Soshace.PORT, Soshace.HOST);
        }, this));

    },

    /**
     * Конфигурируем наше приложение
     *
     * @method
     * @name Blog.configure
     * @return {undefined}
     */
    configure: function () {
        App.use(bodyParser.json());
        App.use(bodyParser.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));
        App.use(cookieParser());
        App.use(methodOverride());
        App.enable('view cache');
        App.set('views', 'app/views/');
        App.engine('hbs', new Handlebars({
            layoutsDir: 'app/views/layouts',
            partialsDir: 'app/views/partials',
            defaultLayout: 'layout',
            extname: '.hbs'
        }));

        App.set('view engine', 'hbs');
        I18n.expressBind(App, {
            locales: Soshace.LOCALES,
            directory: 'app/locales',
            extension: '.json',
            defaultLocale: Soshace.DEFAULT_LOCALE
        });

        App.use(session({
            secret: Soshace.SESSION_KEY,
            saveUninitialized: true,
            resave: true,
            store: new MongoStore({
                db: 'soshace'
            }, function() {
                App.use(Passport.initialize());
                App.use(Passport.session());
            })
        }));

        App.use("/static", express.static(process.cwd() + '/dist'));
    }
});

void new Blog();