var fs = require('fs'),
    DELETE_IMAGE_PATH = global.Soshace.PATHS.profileImages,
    deletePath = __dirname + '/../../..' + DELETE_IMAGE_PATH;

console.log("PATH", DELETE_IMAGE_PATH, 'dirname', __dirname);

module.exports = function(imageName, callback) {
    var fullPathToImage = deletePath + imageName;
    console.log('delete image', fullPathToImage);

    fs.unlink(fullPathToImage, function(error) {
        if (error) {
            callback(error);
            return;
        }
        callback(null, 'success');
    });
};