'use strict';

var multer = require('multer'),
    crypto = require('crypto'),
    getImageExtensionByMimeType = require('./getImageExtensionByMimeType'),
    UPLOAD_DESTINATION_FOLDER = './dist/profileImages/',
    //UPLOAD_DESTINATION_FOLDER = 234,
    IMAGE_FIELD_NAME = 'profileImg',
    MAX_FILE_SIZE_IN_BYTES = 5000000,
    NOT_AN_IMAGE_ERROR = {
        code: 'NOT_AN_IMAGE'
    },
    storage;

storage = multer.diskStorage({
        destination: function (request, file, cb) {
            cb(null, UPLOAD_DESTINATION_FOLDER)
        },
        filename: function (request, file, cb) {
            console.log('in file name!', file);

            crypto.pseudoRandomBytes(16, function (error, raw) {
                var extension = getImageExtensionByMimeType(file.mimetype),
                    fileName = raw.toString('hex') + Date.now() + '.' + extension;

                if (error) {
                    console.error('get random bytes error', error);
                    cb(null, 'errorFileName');
                    return;
                }
                console.log('save with file name', fileName);

                // write additional data for external callback to access file name
                request.multerData = {
                    fileName: fileName
                };

                cb(null, fileName);
            });
        }
});

/**
 * Module is an upload function which only works for specified field <IMAGE_FIELD_NAME>
 *
 * It invokes the callback when file is uploaded successfully or passes an
 * error to callback
 *
 * Possible error codes
 *  code: NOT_AN_IMAGE
 *  code: LIMIT_FILE_SIZE
 *
 * If file was saved successfully it writes additional data to request for client to access file name
 */
module.exports = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE_IN_BYTES
    },
    fileFilter: function(req, file, cb) {
        console.log('filter', 'file', file);

        var extension = getImageExtensionByMimeType(file.mimetype);

        console.log('file extension is', extension);

        if (extension === null) {
            cb(NOT_AN_IMAGE_ERROR, false);
            return;
        }

        cb(null, true);
    }
}).single(IMAGE_FIELD_NAME);