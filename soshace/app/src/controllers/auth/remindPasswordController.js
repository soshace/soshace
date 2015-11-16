'use strict';

var _ = require('underscore'),
    Mongoose = require('mongoose'),
    ObjectId = Mongoose.Types.ObjectId,
    Controller = srcRequire('common/controller'),
    UsersModel = srcRequire('models/usersModel'),
    PasswordResetModel = srcRequire('models/resetPasswordModel'),
    RequestParams = srcRequire('common/requestParams'),
    SendMail = srcRequire('common/sendMail'),
    Helpers = srcRequire('common/helpers'),
    Passport = require('passport'),
    LoginController = srcRequire('controllers/auth/loginController')
    ;

/**
 * Controller of remind password page
 *
 * @class RemindPasswordController
 */
module.exports = Controller.extend({
    /**
     * Method renders remind password page
     *
     * @public
     * @function
     * @name RemindPasswordController#renderRemindPasswordPage
     * @return {undefined}
     */
    renderRemindPasswordPage: function () {
        var request = this.request,
            response = this.response,
            requestParams = new RequestParams(request),
            locale,
            profileUserName;

        if (requestParams.isAuthenticated) {
            locale = requestParams.locale;
            profileUserName = requestParams.profileUserName;
            response.redirect('/' + locale + '/users/' + profileUserName);
            return;
        }

        response.render('auth/remindPassword', _.extend(requestParams, {
            title: 'Remind password page'
        }));
    },

    /**
     * Renders a page for password resetting
     *
     * @public
     * @function
     * @name RemindPasswordController#resetPassword
     * @return {undefined}
     */
    resetPassword: function () {
        var request = this.request,
            response = this.response,
            requestParams = new RequestParams(request),
            code = request.query.code,
            now = Date.now(),
            MS_PER_DAY = 1000 * 60 * 60 * 24,
            TWO_DAYS = MS_PER_DAY * 2,
            self = this;

        PasswordResetModel.findOne({code: code}, function (error, resetCode) {
            if (error) {
                self.renderError('Page not found', 404);
                console.log(error);
                return;
            }

            if (!resetCode) {
                self.renderError('Page not found', 404);
                return;
            }
            var timestamp = resetCode.timestamp;

            if (now - timestamp > TWO_DAYS) {
                self.renderError('Reset code outdated', 410);
                return;
            }

            UsersModel.findOne({_id: resetCode.userId}, function (error, user) {
                response.render('auth/remindPasswordSuccess', _.extend(requestParams, {
                    title: 'Reset password',
                    token: code,
                    email: user.email
                }));
            });

        });

    },

    /**
     * Changes a password and removes password reset document
     *
     * @public
     * @function
     * @name RemindPasswordController#changePassword
     * @return {undefined}
     */

    changePassword: function () {
        var request = this.request,
            response = this.response,
            body = request.body,
            MS_PER_DAY = 1000 * 60 * 60 * 24,
            TWO_DAYS = MS_PER_DAY * 2,
            now = new Date(),
            self = this;
        PasswordResetModel.findOne({code: body.token}, function (error, resetCode) {
            if (error) {
                self.sendError('Page not found', 404);
                console.log(error);
                return;
            }

            if (!resetCode) {
                self.sendError('Page not found', 404);
                return;
            }

            var timestamp = resetCode.timestamp;
            timestamp = Date.UTC(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());

            if (now - timestamp > TWO_DAYS) {
                self.sendError('Reset code outdated', 410);
                return;
            }

            PasswordResetModel.find({code: body.token}).remove(function() {
                Passport.authenticate('local', LoginController.authenticateHandler)(request, response, function() {});
                UsersModel.findOneAndUpdatePassword(resetCode.userId, body.password);
                response.send({success: true});
            });
        });
    },

    /**
     * Method handles find user error and returns flag to determine if error occurred
     *
     * @method
     * @name RemindPasswordController#checkFindUserError
     * @param error
     * @param user
     * @returns {boolean}
     */
    checkFindUserError: function(error, user) {
        if (error) {
            this.sendError('Server is too busy, try later', 503);
            return true;
        }

        if (user === null) {
            this.renderError('User not found', 404);
            return true;
        }

        return false;
    },

    /**
     * Method checks old password and updates password to new if old one is correct
     *
     * @method
     * @name RemindPasswordController#findUserHandler
     * @param error
     * @param user
     * @param userId
     * @param password
     * @param oldPassword
     * @returns {undefined}
     */
    findUserHandler: function(error, user, userId, password, oldPassword) {
        var self = this,
            response = this.response,
            findUserError = this.checkFindUserError(error, user);

        if (findUserError) {
            return;
        }

        user.comparePassword(oldPassword, function(error) {
            if (error) {
                self.sendError(error);
                return;
            }

            UsersModel.findOneAndUpdatePassword(userId, password, function() {
                response.end();
            });
        });
    },

    /**
     * Updates a password
     *
     * @public
     * @function
     * @name RemindPasswordController#changePassword
     * @return {undefined}
     */

    updatePassword: function () {
        var request = this.request,
            body = request.body,
            params = new RequestParams(request),
            userId = params.profile.id,
            password = body.password,
            oldPassword = body.oldPassword,
            newPasswordValidationError,
            self = this;

        if (!oldPassword) {
            this.sendError('Bad request', 400);
            return;
        }

        newPasswordValidationError = UsersModel.validatePassword(password);
        if (newPasswordValidationError) {
            this.sendError(newPasswordValidationError, 400);
            return;
        }

        UsersModel.findOne({_id: new ObjectId(userId)}, function(error, user) {
            self.findUserHandler(error, user, userId, password, oldPassword);
        });
    },

    /**
     * Method saves password reset document and returns secret confirmation code in callback
     *
     * @method
     * @param userId
     * @param email
     * @param callback
     * @return {undefined}
     */
    saveResetPasswordToken: function(userId, email, callback) {
        var timestamp = Date.now(),
            code = Helpers.encodeMd5(timestamp + email),
            resetPasswordModel = {
                code: code,
                userId: userId,
                timestamp: timestamp
            };

        PasswordResetModel.update({userId: userId}, resetPasswordModel, {upsert: true}, function(error) {
            if (error) {
                callback(error);
                return;
            }

            callback(null, code);
        });
    },

    /**
     * Method sends email to confirm password change and checks if user with given email exists
     *
     * @public
     * @method
     * @name RemindPasswordController#remindPasswordHandler
     * @returns {undefined}
     */
    remindPasswordHandler: function () {
        var request = this.request,
            response = this.response,
            requestBody = request.body,
            emailValue = requestBody.email,
            emailValidationError = UsersModel.validateEmail(emailValue),
            self = this;

        if (emailValidationError) {
            this.sendError({
                error: {
                    email: emailValidationError
                }
            });
            return;
        }

        UsersModel.findOne({email: emailValue}, function(error, user) {
            var findUserError = self.checkFindUserError(error, user);
            if (findUserError) {
                return;
            }

            self.saveResetPasswordToken(user.id, emailValue, function(error, resetPasswordCode) {

                if (error) {
                    self.sendError('Server is too busy, try later', 503);
                    return;
                }

                SendMail.sendPasswordResetMail(request, user, resetPasswordCode);

                response.end();
            });

        });
    }
});