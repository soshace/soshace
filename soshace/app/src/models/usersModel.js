'use strict';
//TODO: добавить trim перед сохранением полей

var _ = require('underscore'),
    Mongoose = require('mongoose'),
    Schema = Mongoose.Schema,
    Bcrypt = require('bcrypt'),
    Validators = srcRequire('common/validators'),
    Helpers = srcRequire('common/helpers'),
    SALT_WORK_FACTOR = 10,
    SEX_LIST = [
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

    /**
     * Класс для работы с моделью пользователей
     * Пользователи, которые имеют подтвержденные email
     *
     * @class
     * @name UsersShema
     * @type {Schema}
     */
    UsersShema = new Schema({
        //код подтверждения email
        code: {
            type: String,
            //поле не может быть изменено пользователем
            readonly: true
        },
        firstName: {
            //Поля, которые отностятся к информации о профиле
            //По этим полям определятся заполненность профиля
            profileInformation: true,
            type: String,
            default: null,
            public: true
        },
        lastName: {
            //Поля, которые отностятся к информации о профиле
            //По этим полям определятся заполненность профиля
            profileInformation: true,
            type: String,
            default: null,
            public: true
        },
        userName: {
            //поле доступно для отправки на клиент
            public: true,
            type: String,
            unique: true,
            //TODO: разобраться почему mongoose прогоняет все валидаторы
            //Валидация идет с конца!
            validate: [
                {
                    validator: Validators.userNameUnique,
                    msg: 'User with same username already exists.'
                },
                {
                    validator: Soshace.PATTERNS.userName,
                    msg: 'Use the Latin alphabet, numbers, &#34;.&#34;, &#34;_&#34;, &#34;-&#34;.'
                },
                {
                    validator: Validators.required,
                    msg: 'Username can&#39;t be blank.'
                }
            ]
        },
        email: {
            type: String,
            //поле не может быть изменено пользователем
            readonly: true,
            unique: true,
            //TODO: разобраться почему mongoose прогоняет все валидаторы
            //Валидация идет с конца!
            validate: [
                {
                    validator: Validators.emailUnique,
                    msg: 'User with same email already exists.'
                },
                {
                    validator: Soshace.PATTERNS.email,
                    msg: 'Email is invalid.'
                },
                {
                    validator: Validators.required,
                    msg: 'Email can&#39;t be blank.'
                }
            ]
        },
        sex: {
            //Поля, которые отностятся к информации о профиле
            //По этим полям определятся заполненность профиля
            profileInformation: true,
            //поле доступно для отправки на клиент
            public: true,
            type: String,
            default: null
        },
        aboutAuthor: {
            //Поля, которые отностятся к информации о профиле
            //По этим полям определятся заполненность профиля
            profileInformation: true,
            //поле доступно для отправки на клиент
            public: true,
            type: String,
            default: null
        },
        birthday: {
            //Поля, которые отностятся к информации о профиле
            //По этим полям определятся заполненность профиля
            profileInformation: true,
            //поле доступно для отправки на клиент
            //Используется timestamp
            public: true,
            type: Date,
            default: null
        },
        password: {
            type: String,
            //TODO: разобраться почему mongoose прогоняет все валидаторы
            //Валидация идет с конца!
            validate: [
                {
                    validator: Validators.passwordMinLength,
                    msg: 'Password length should&#39;t be less than 6 characters.'
                },
                {
                    validator: Validators.required,
                    msg: 'Password can&#39;t be blank.'
                }
            ]
        },
        emailConfirmed: {
            type: Boolean,
            default: false,
            //поле не может быть изменено пользователем
            readonly: true
        },
        //Является ли пользователь админом
        admin: {
            //поле не может быть изменено пользователем
            readonly: true,
            type: Boolean,
            default: false
        },
        locale: {
            //поле доступно для отправки на клиент
            public: true,
            type: String,
            default: 'en'
        }
    });

UsersShema.virtual('fullName').get(function () {
    var firstName = this.firstName,
        lastName = this.lastName,
        fullName = [];

    if (lastName !== null) {
        fullName.push(lastName);
    }

    if (firstName !== null) {
        fullName.push(firstName);
    }

    return fullName.join(' ');
});

/**
 * Метод проверяет сооветствие пришедшего типа
 * значения поля типу установленому в модели
 *
 * @method
 * @name checkFieldType
 * @param {String} field
 * @param {*} value
 * @returns {boolean} вовращает true, если поле соответствует типу в модели
 */
function checkFieldType(field, value) {
    var userPaths = UsersShema.paths,
        fieldSetting = userPaths[field].options;

    if (value === null) {
        return true;
    }

    if (fieldSetting.type === String) {
        return typeof value === 'string';
    }

    if (fieldSetting.type === Array) {
        return value instanceof Array;
    }

    return true;
}

/**
 * The method checks whether an email exists
 *
 * @method
 * @name UsersShema.validateEmail
 * @param {String} email проверяемый email
 * @return {String | undefined} ошибка
 */
UsersShema.methods.emailExists = function (email) {
    console.log(email === this.email);
};

/**
 * Метод возвращает список полов с выбранным в модели полом
 *
 * @method
 * @name UsersModel#getSexList
 * @returns {Array}
 */
UsersShema.methods.getSexList = function () {
    var sexList = _.clone(SEX_LIST),
        currentSex = this.sex;

    if (currentSex === null) {
        return sexList;
    }

    _.each(sexList, function (sex) {
        var isCurrentSex = sex.value === currentSex;
        sex.selected = isCurrentSex;
    });

    return sexList;
};

/**
 * Метод возвращает true, если информация по прфилю пустая
 *
 * @method
 * @name UsersModel#isProfileInfoEmpty
 * @returns {Boolean}
 */
UsersShema.methods.isProfileInfoEmpty = function () {
    var isEmpty = true,
        userPaths = UsersShema.paths,
        fieldSettings;

    _.every(userPaths, _.bind(function (path, field) {
        if (!this[field]) {
            return true;
        }

        fieldSettings = path.options;
        if (fieldSettings.profileInformation) {
            isEmpty = false;
            return false;
        }

        return true;
    }, this));
    return isEmpty;
};

/**
 * Метод сравнения паролей
 *
 * @method
 * @name UsersShema#comparePassword
 * @param {String} candidatePassword проверяемый пароль
 * @param {Function} callback
 * @returns {undefined}
 */
UsersShema.methods.comparePassword = function (candidatePassword, callback) {
    Bcrypt.compare(candidatePassword, this.password, function (error, isMatch) {
        if (error) {
            callback({error: {password: 'Password is not correct.'}, code: 400});
            return;
        }

        if (!isMatch) {
            callback({error: {password: 'Password is not correct.'}, code: 400});
            return;
        }

        callback(null);
    });
};

/**
 * Метод возвращает доступные на клиенте для профиля (владельца)
 *
 * @method
 * @name UsersShema#getProfileFields
 * @returns {Object}
 */
UsersShema.methods.getProfileFields = function () {
    var profileFields = this.getPublicFields();

    profileFields.emailConfirmed = this.emailConfirmed;
    return profileFields;
};

/**
 * Метод возвращает публичные поля пользователя (общедоступные)
 *
 * @method
 * @name UsersShema#getPublicFields
 * @returns {Object}
 */
UsersShema.methods.getPublicFields = function () {
    var publicFields = {},
        userPaths = UsersShema.paths;

    _.each(userPaths, _.bind(function (pathSettings, path) {
        var pathOptions = pathSettings.options;

        if (pathOptions.public) {
            publicFields[path] = this[path];
        }
    }, this));

    publicFields._id = this._id;

    return publicFields;
};

/**
 * Шифруем пароль перед сохранением
 */
UsersShema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) {
        next();
        return;
    }

    Bcrypt.genSalt(SALT_WORK_FACTOR, function (error, salt) {
        if (error) {
            next(error);
            return;
        }

        Bcrypt.hash(user.password, salt, function (error, hash) {
            if (error) {
                next(error);
                return;
            }
            user.password = hash;
            next();
        });
    });
});

/**
 * Создаем код подтверждения email
 */
UsersShema.pre('save', function (next) {
    var user = this,
        time = String((new Date()).getTime());

    user.code = Helpers.encodeMd5(user.email + time);
    next();
});

/**
 * Метод проверяет обновляемые поля модели на соответствие типу
 *
 * @method
 * @name UsersShema.isUpdateFieldsValid
 * @param {Object} update обновляемые данные
 * @returns {Boolean} false - ошибка
 */
UsersShema.statics.isUpdateFieldsValid = function (update) {
    var isValid = true;

    _.every(update, function (value, field) {
        isValid = checkFieldType(field, value);
        return isValid;
    });

    return isValid;
};

/**
 * Метод удляет все поля из запроса не соответствующие
 * полям модели и имеющие флаг readOnly
 *
 * @method
 * @name PostsShema.clearUpdate
 * @param {Object} update обновляемые данные
 * @returns {Object} очищенный объект обновления
 */
UsersShema.statics.clearUpdate = function (update) {
    var clearUpdate = {},
        userPaths = UsersShema.paths;

    _.each(update, function (value, fieldName) {
        var modelField = userPaths[fieldName],
            fieldSettings;

        if (_.isUndefined(modelField)) {
            return;
        }

        fieldSettings = modelField.options;

        if (fieldSettings.readOnly) {
            return;
        }

        clearUpdate[fieldName] = value;
    });

    return clearUpdate;
};

/**
 * Метод обновляет персональные данные профиля
 * (у которых нет флага readOnly)
 *
 * @method
 * @name UsersShema.updatePersonalData
 * @param {String} userId id пользователя
 * @param {Object} update обновляемые поля
 * @param {Function} callback
 * @returns {undefined}
 */
UsersShema.statics.updatePersonalData = function (userId, update, callback) {
    if (typeof update !== 'object') {
        callback({error: 'Bad Request', code: 400});
        return;
    }
    update = this.clearUpdate(update);

    //Проверка соответствия типам полей
    if (!this.isUpdateFieldsValid(update)) {
        callback({error: 'Bad Request', code: 400});
        return;
    }

    this.update({_id: userId}, {$set: update}, _.bind(function (error, updated) {
        if (error) {
            callback({error: 'Server is too busy, try later.', code: 503});
            return;
        }

        if (updated !== 1) {
            callback({error: 'Bad request.', code: 400});
            return;
        }

        callback(null);
    }, this));
};

/**
 * Метод возвращает данные пользователя
 *
 * @method
 * @name UsersShema.getUserByUserName
 * @param {String} userName
 * @param {Function} callback
 * @return {Cursor}
 */
UsersShema.statics.getUserByUserName = function (userName, callback) {
    return this.findOne({userName: userName}, {
        fullName: 1,
        userName: 1,
        sex: 1,
        aboutAuthor: 1,
        birthday: 1,
        _id: 1
    }).exec(function (error, user) {
        if (error) {
            callback({error: 'Server is too busy, try later', code: 503});
            return;
        }
        callback(null, user);
    });
};

/**
 * Метод находит пользователя по email
 *
 * @method
 * @name UsersShema.getUserByEmail
 * @param {String} email проверяемый email
 * @param {Function} callback
 * @return {Cursor}
 */
UsersShema.statics.getUserByEmail = function (email, callback) {
    return this.findOne({email: email}).exec(function (error, user) {
        if (error) {
            callback({error: 'Server is too busy, try later', code: 503});
            return;
        }
        callback(null, user);
    });
};

/**
 * Метод делает проверку email, используется при логине,
 * т.к. валидация модели не подходит
 *
 * @method
 * @name UsersShema.validateEmail
 * @param {String} email проверяемый email
 * @return {String | undefined} ошибка
 */
UsersShema.statics.validateEmail = function (email) {
    var emailNotEmpty = Validators.required(email);

    if (!emailNotEmpty) {
        return 'Email can&#39;t be blank.';
    }

    if (!Soshace.PATTERNS.email.test(email)) {
        return 'Email is invalid.';
    }
};

/**
 * Метод делает проверку password, используется при логине,
 * т.к. валидация модели не подходит
 *
 * @method
 * @name UsersShema.validatePassword
 * @param {String} password проверяемый пароль
 * @return {String | undefined} ошибка
 */
UsersShema.statics.validatePassword = function (password) {
    var passwordNotEmpty = Validators.required(password);

    if (!passwordNotEmpty) {
        return 'Password can&#39;t be blank.';
    }

    if (!Validators.passwordMinLength(password)) {
        return 'Password can&#39;t be less than 6 characters.';
    }
};

/**
 * Method sets emailConfirm flag to true
 *
 * @method
 * @name UsersShema.confirmEmail
 * @param {String} code код подтверждения email
 * @param {Function} callback
 * @return {undefined}
 */
UsersShema.statics.confirmEmail = function (code, callback) {
    var self = this;
    this.collection.findOne({code: code}, function(error, user) {
        if (error) {
            console.error(error);
            callback(error);
            return;
        }

        if (!user) {
            callback('User not found');
            return;
        }

        if (user.emailConfirmed) {
            callback('Email is already confirmed');
            return;
        }

        self.collection.update({code: code}, {$set: {emailConfirmed: true}}, function(error) {
            if (error) {
                callback('Server is too busy, try later');
                return;
            }

            callback(null, user);
        });
    });
};

/**
 * Updates password
 *
 * @method
 * @name UsersShema.updatePassword
 * @param {String} userId
 * @param {String} password
 * @param {Function} callback
 * @return {undefined}
 */

UsersShema.statics.findOneAndUpdatePassword = function (userId, password, callback) {
    var self = this,
        serverIsBusyError = {
            error: 'Server is too busy, try later',
            code: 503
        },
        useCallback = typeof callback === 'function';

    Bcrypt.genSalt(SALT_WORK_FACTOR, function (error, salt) {
        if (error) {
            console.error(error);
            useCallback && callback(serverIsBusyError);
            return;
        }

        Bcrypt.hash(password, salt, function (error, hash) {
            if (error) {
                console.error(error);
                useCallback && callback(serverIsBusyError);
                return;
            }
            self.update({_id: userId}, {password: hash}, function (error, user) {
                useCallback && callback(null, user);
            });
        });
    });

};

module.exports = Mongoose.model('users', UsersShema);