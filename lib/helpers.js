const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

//---------------- hash the string

const helpers = {};

helpers.hash = string => {
    if (typeof(string) == 'string' && string.length > 0) {
        const hushedString = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hushedString;
    } else {
        return false;
    };
};

//---------------- parse json to object

helpers.parseJsonToObject = str => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

//---------------- create random string

helpers.createNewString = strLength => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

    if (strLength) {
        const possibleCharacters = 'abcdefghijklmnopqrstuwxyz0123456789';
        let str = '';
        for (i=1; i<=strLength; i++) {
            const randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomChar;
        };
        return str;
    } else {
        return false;
    };
};

//---------------- send email via mailgun

helpers.sendMailgun = (email, text, callback) => {
    
    email = typeof(email) == 'string' && email.trim().length > 0 ? email.trim() : false;
    text = typeof(text) == 'string' && text.trim().length > 0 ? text : false;

    if(email && text) {

        const payload = {
            'from': config.mailgun.dns,
            'to': email,
            'subject': 'order receipt',
            'text': text
        };

        const stringPayload = querystring.stringify(payload);
 
        const requestDetails = {
            'protocol': 'https:',
            'method': 'POST',
            'hostname': 'api.mailgun.net',
            'path': `/v3/${config.mailgun.domainName}.mailgun.org/messages`,
            'auth': `${config.mailgun.authName}:${config.mailgun.authKey}`,
            'headers': {'Content-Type': 'application/x-www-form-urlencoded'}
        };

        const req = https.request(requestDetails, res => {

            const status = res.statusCode;

            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was ' + status);
            };
        });

        req.on('error', e => {
            callback(e);
        });

        req.write(stringPayload);
        req.end();

    } else {
        callback('Given parameters are missing or invalid');
    };
};

//---------------- create order charge with stripe

helpers.createCharge = (amount, callback) => {
    
    amount = typeof(amount) == 'number' && amount > 0.5 ? amount : false;

    if(amount) {

        const requestDetails = {
            'amount': amount,
            'currency': 'usd',
            'protocol': 'https:',
            'hostname': 'api.stripe.com',
            'path': '/v1/charges',
            'source': 'tok_mastercard',
            'auth': config.stripe.api_key,
            'headers': {'Content-Type': 'application/x-www-form-urlencoded'}
        };

        const req = https.request(requestDetails, res => {

            const status = res.statusCode;

            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was ' + status);
            };
        });

        req.on('error', e => {
            callback(e);
        });

        req.end();

    } else {
        callback('Given parameters are missing or invalid');
    };
};

//---------------- validate an email

helpers.validateEmail = email => {

    const pattern = '^[a-z0-9](\.?[a-z0-9_-]){0,}@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$';

    if(email.match(pattern) !== null ) {
        return true;
    };
};


// ---------------------- Get the string content of a template
helpers.getTemplate = (templateName, callback) => {

    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};

    if(templateName){
      const templatesDir = path.join(__dirname,'/../templates/');

      fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
        if(!err && str && str.length > 0){
          callback(false,str);
        } else {
          callback('No template could be found');
        }
      });
    } else {
      callback('A valid template name was not specified');
    }
};

// ---------------------- Add all universal templates to have the html built

helpers.getContent = (str,data,callback) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    // Get the header
    helpers.getTemplate('_header', (err,headerString) => {
      if(!err && headerString){
        // Get the footer
        helpers.getTemplate('_footer', (err,footerString) => {
          if(!err && footerString){
              // Get the nav menu
              helpers.getTemplate('_nav', (err, navString) => {
                if(!err && navString) {
                // Get the main content
                    helpers.getTemplate(str,(err, contentString) => {
                        if(!err && contentString) {
                            // Add them all together
                            let fullString = headerString+navString+contentString+footerString;
                            // keys interpolate
                            fullString = helpers.interpolate(fullString, data);
                            callback(false,fullString);
                        } else {
                            callback('Could not find the content template');
                        };
                    });
                } else {
                    callback('Could not find the menu template');
                };
              });
          } else {
            callback('Could not find the footer template');
          }
        });
      } else {
        callback('Could not find the header template');
      }
    });
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = (str,data) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
  
    // Add the templateGlobals to the data object, prepending their key name with "global."
    for(let keyName in config.templateGlobals){
       if(config.templateGlobals.hasOwnProperty(keyName)){
         data['global.'+keyName] = config.templateGlobals[keyName]
       }
    }
    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for(let key in data){
       if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
          const replace = data[key];
          const find = '{'+key+'}';
          str = str.replace(find,replace);
       }
    }
    return str;
  };

  // Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if(fileName){
      var publicDir = path.join(__dirname,'/../public/');
      fs.readFile(publicDir+fileName, function(err,data){
        if(!err && data){
          callback(false,data);
        } else {
          callback('No file could be found');
        }
      });
    } else {
      callback('A valid file name was not specified');
    }
  };

//

module.exports = helpers;