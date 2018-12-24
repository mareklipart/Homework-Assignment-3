const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {};

lib.baseDir = path.join(__dirname, '../.data/');

//---------------- create data file

lib.create = (dir, file, data, callback) => {

    fs.open(`${lib.baseDir}${dir}/${file}.json`,'wx', (err, fileDecriptor) => {

        if (!err && fileDecriptor) {

            const stringData = JSON.stringify(data);

            fs.writeFile(fileDecriptor, stringData, err => {

                if(!err) {

                    fs.close(fileDecriptor, err => {

                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        };

                    })

                } else {
                    callback('Error writing to new file');
                };

            });

        } else {
            callback ('Could not create new file, it may already exists');
        };

    });

};
//---------------- read data file

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`,'utf8', (err, data) => {
        if (!err && data) {
            parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data)
        }
    });
}

//---------------- update data file

lib.update = (dir, file, data, callback) => {

    fs.open(`${lib.baseDir}${dir}/${file}.json`,'r+', (err, fileDecriptor) => {

        if(!err && fileDecriptor) {

            const stringData = JSON.stringify(data);

            fs.truncate(fileDecriptor, err => {

                if(!err) {

                    fs.writeFile(fileDecriptor, stringData, err => {

                        if(!err) {

                            fs.close(fileDecriptor, err => {

                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file');
                                };

                            });

                        } else {
                            callback('Error writing to existing file');
                        };

                    });

                } else {
                    callback('Error truncating file');
                };

            });

        } else {
            callback('could not open the file for updating, it may not exist yet');
        };

    });
};

//---------------- delete data file

lib.delete = (dir, file, callback) => {

    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, err => {

        if(!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        };

    });

};


module.exports = lib;