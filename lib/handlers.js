const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');



const handlers = {};


handlers.notFound = (data, callback) => {
    callback(404);
};


//-----------------define HTML handlers

handlers.index = (data, callback) => {
         // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Prepare data for interpolation
    var templateData = {
      'head.title' : 'Welcome!',
      'head.description' : 'Login or signup to make an order',
      'body.class' : 'index'
    };
    // Read in a template as a string
    helpers.getContent('index',templateData,function(err,str){
      if(!err && str){
        // return as an HTML content
        callback(200,str,'html');
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};

//

handlers.public = (data, callback) => {
    // Reject any request that isn't a GET
  if(data.method == 'get'){
    // Get the filename being requested
    var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
    if(trimmedAssetName.length > 0){
      // Read in the asset's data
      helpers.getStaticAsset(trimmedAssetName,function(err,data){
        if(!err && data){

          // Determine the content type (default to plain text)
          var contentType = 'plain';

          if(trimmedAssetName.indexOf('.css') > -1){
            contentType = 'css';
          }

          if(trimmedAssetName.indexOf('.png') > -1){
            contentType = 'png';
          }

          if(trimmedAssetName.indexOf('.jpg') > -1){
            contentType = 'jpg';
          }

          if(trimmedAssetName.indexOf('.ico') > -1){
            contentType = 'favicon';
          }

          // Callback the data
          callback(200,data,contentType);
        } else {
          callback(404);
        }
      });
    } else {
      callback(404);
    }

  } else {
    callback(405);
  }
};

//

handlers.accountCreate = (data, callback) => {
    // Reject any request that isn't a GET
    if(data.method == 'get'){
        // Prepare data for interpolation
        var templateData = {
        'head.title' : 'Sign up!',
        'head.description' : 'Sign up!',
        'body.class' : 'index'
    };
    // Read in a template as a string
    helpers.getContent('accountCreate',templateData,function(err,str){
        if(!err && str){
        // return as an HTML content
        callback(200,str,'html');
        } else {
        callback(500,undefined,'html');
        }
        });
        } else {
        callback(405,undefined,'html');
    }
};

//

handlers.sessionCreate = (data, callback) => {
        // Reject any request that isn't a GET
        if(data.method == 'get'){
            // Prepare data for interpolation
            var templateData = {
            'head.title' : 'Logi in!',
            'head.description' : 'Login in',
            'body.class' : 'index'
        };
        // Read in a template as a string
        helpers.getContent('sessionCreate',templateData,function(err,str){
            if(!err && str){
            // return as an HTML content
            callback(200,str,'html');
            } else {
            callback(500,undefined,'html');
            }
            });
            } else {
            callback(405,undefined,'html');
        }
};

//

handlers.cartCreate = (data, callback) => {
    // Reject any request that isn't a GET
    if(data.method == 'get'){
        // Prepare data for interpolation
        var templateData = {
        'head.title' : 'Cart!',
        'head.description' : 'Cart',
        'body.class' : 'index'
    };
    // Read in a template as a string
    helpers.getContent('cartCreate',templateData,function(err,str){
        if(!err && str){
        // return as an HTML content
        callback(200,str,'html');
        } else {
        callback(500,undefined,'html');
        }
        });
        } else {
        callback(405,undefined,'html');
    }
};

//

handlers.orderCreate = (data, callback) => {
    // Reject any request that isn't a GET
    if(data.method == 'get'){
        // Prepare data for interpolation
        var templateData = {
        'head.title' : 'Order!',
        'head.description' : 'Order',
        'body.class' : 'index'
    };
    // Read in a template as a string
    helpers.getContent('orderCreate',templateData,function(err,str){
        if(!err && str){
        // return as an HTML content
        callback(200,str,'html');
        } else {
        callback(500,undefined,'html');
        }
        });
        } else {
        callback(405,undefined,'html');
    }
};

//---------------- define user handlers

handlers.users = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._users = {};

handlers._users.post = (data, callback) => {

    const name = typeof(data.payload.name) == 'string' && data.payload.name.length > 0 ? data.payload.name : false;
    const email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.toLowerCase()) ? data.payload.email : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.length > 0 ? data.payload.streetAddress : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.trim().length >= 6 ? data.payload.user.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;
    
    if (name && email && streetAddress && user && password) { 

        _data.read('users','user', (err, data) => {
            if(err) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    const userObject = {
                        'name': name,
                        'email': email,
                        'streetAddress': streetAddress,
                        'user': user,
                        'password': hashedPassword,
                        'lastLogged': Date.now()
                    };

                    _data.create('users', user, userObject, err => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not create a new user'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hush the user/s password'});
                };
            } else {
                callback(400, {'Error':'A user with that user already exists'});
            };
        });
    } else {
        callback(400, {'Error': 'Missing required fields.'})
    };
};

handlers._users.get = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                _data.read('users', user, (err, data) => {
                    if (!err && data) {
                        delete data.password;
                        callback (200, data);
                    } else {
                        callback(404);
                    };
                });
            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

};

handlers._users.put = (data, callback) => {

    const name = typeof(data.payload.name) == 'string' && data.payload.name.length > 0 ? data.payload.name : false;
    const email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.toLowerCase()) ? data.payload.email : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.length > 0 ? data.payload.streetAddress : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.trim().length >= 6 ? data.payload.user.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;
    const lastLogged = Date.now();

    if (user) {
        if (name || email || streetAddress || password || lastLogged) {

            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            handlers._tokens.verifyToken(token, user, isTokenvalid => {

                if(isTokenvalid) {
                    
                    _data.read('users', user, (err, userData) => {

                        if (!err && userData) {
                            if (name) {
                                userData.name = name
                            }
                            if (email) {
                                userData.email = email
                            }
                            if (streetAddress) {
                                userData.streetAddress = streetAddress
                            }
                            if (password) {
                                userData.password = helpers.hash(password);
                            }
                            if (lastLogged) {
                                userData.lastLogged = lastLogged
                            }
        
                            _data.update('users', user, userData, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update the user'})
                                }
                            });
        
                        } else {
                            callback(400, {'Error': 'The specified user does not exist'});
                        };
                    });

                } else {
                    callback(400, {'Error': 'Missing required token in header'})
                };
            
            });

        } else {
            callback(400, {'Eror': 'Missing fields to update'});
        };
    } else {
        callback(400, {'Error': 'Required field missing'});
    }
    

};

handlers._users.delete = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                
                _data.read('users', user, (err, userData) => {
                    if (!err && userData) {
                        
                        _data.delete('users', user, err => {
                            if (!err) {
                                
                                callback(200);

                            } else {
                                callback(400, {'Error': 'Could not delete the specified user'})
                            }
                        });
        
                    } else {
                        callback(400, {'Error': 'Could not find the specified user'});
                    };
                });

            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };
            
        });    

    } else {
        callback(400, {'Error': 'Missing required field'});
    };     

};

//---------------- define token handlers

handlers.tokens = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._tokens = {};


handlers._tokens.post = (data, callback) => {

    const user = typeof(data.payload.user) == 'string' && data.payload.user.trim().length >= 6 ? data.payload.user.trim() : false
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false
    
    if(user && password) {
        _data.read('users', user, (err, userData) => {
            if(!err && userData) {

                const hashedPassword = helpers.hash(password);

                if(hashedPassword==userData.password) {

                    userData.lastLogged = Date.now();

                    _data.update('users', user, userData, err => {
                        if (!err) {
                            
                            const tokenId = helpers.createNewString(20);
                            const expires = Date.now() + 1000 * 60 * 60;

                            const tokenObject = {
                                'user': user,
                                'id': tokenId,
                                'expires': expires
                            };

                            _data.create('tokens', tokenId, tokenObject, err => {

                                if(!err) {
                                    callback(200, tokenObject)
                                } else {
                                    callback(500, {'Error': 'Could not create the new token'})
                                };

                            });

                        } else {
                            callback(500, {'Error': 'Could not update the user'})
                        }
                    });
        
                } else {
                    callback(400, {'Error': 'The passwords do not match'});
                };

            } else {
                callback(400, {'Error': 'Could not find the specified user'});
            };
        });

    } else {
        callback (400, {'Error': 'Missing required fields'})
    }


};

handlers._tokens.get = (data, callback) => {

    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;

    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback (200, tokenData);
            } else {
                callback(404);
            };
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

    
};

handlers._tokens.put = (data, callback) => {
    
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;

    if(id && extend) {

        _data.read('tokens', id, (err, tokenData) => {

            if(!err && tokenData) {

                if(tokenData.expires > Date.now()) {

                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    _data.update('tokens', id, tokenData, err => {

                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not extend tokens expiration'})
                        };

                    });

                } else {
                    callback(400, {'Error': 'The token has already expired, cannot be extended'})
                }

            } else {
                callback(400, {'Error': 'Specified token does not exist'});
            };

        });

    } else {
        callback(400, {'Error': 'Missing required fields'});
    };
};

handlers._tokens.delete = (data, callback) => {

    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;

    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                
                _data.delete('tokens', id, err => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(400, {'Error': 'Could not delete the specified token'})
                    }
                });

            } else {
                callback(400, {'Error': 'Could not find the specified token'});
            };
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    };
    
};



handlers._tokens.verifyToken = (id, user, callback) => {

    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.user == user && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }

    });

}

//---------------- define menu handlers

handlers.menu = (data, callback) => {

    const acceptableMethods = ['get'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._menu[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._menu = {};

handlers._menu.get = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {
 
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                _data.read('menu', 'menu', (err, data) => {
                    if (!err && data) {
                        callback (200, data);
                    } else {
                        callback(404);
                    };
                });
            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

};

//---------------- define cart handlers

handlers.cart = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._cart[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._cart = {};


handlers._cart.post = (data, callback) => {

    const items = typeof(data.payload.items) == 'object' && data.payload.items.length > 0 ? data.payload.items : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.length > 0 ? data.payload.user : false;

    if (user && items) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {

                _data.read('carts', user, (err, data) => {
                    if(err) {
                                
                        _data.read('menu', 'menu', (err, data) => {
                            if (!err && data) {

                                const cartObject = {};
                                cartObject.items = [];

                                items.forEach(id => {

                                    for(let i=0; i<data.menu.items.length; i++) {
                                        if(id == data.menu.items[i].id) {
                                            cartObject.items.push(data.menu.items[i]);
                                        }
                                    }   
                                });

                                _data.create('carts', user, cartObject, err => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        callback(500, {'Error': 'Could not create a new cart'});
                                    }
                                });
                                
                            } else {
                                callback(404, {'Error': 'Could not read menu'});
                            };
                        });

                    } else {
                        callback(400, {'Error':'A cart with that user already exists'});
                    };
                });


            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 
};

handlers._cart.get = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                _data.read('carts', user, (err, data) => {
                    if (!err && data) {
                        callback (200, data);
                    } else {
                        callback(404);
                    };
                });
            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 

};

handlers._cart.put = (data, callback) => {

    const items = typeof(data.payload.items) == 'object' && data.payload.items.length > 0 ? data.payload.items : false;
    const user = typeof(data.payload.user) == 'string' && data.payload.user.length > 0 ? data.payload.user : false;

    if (user && items) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {

                _data.read('carts', user, (err, data) => {
                    if(!err && data) {
                                
                        _data.read('menu', 'menu', (err, data) => {
                            if (!err && data) {

                                const cartObject = {};
                                cartObject.items = [];

                                items.forEach(id => {

                                    for(let i=0; i<data.menu.items.length; i++) {
                                        if(id == data.menu.items[i].id) {
                                            cartObject.items.push(data.menu.items[i]);
                                        }
                                    }   

                                });

                                _data.update('carts', user, cartObject, err => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not create a new cart'});
                                    }
                                });
                                
                            } else {
                                callback(404, {'Error': 'Could not read menu'});
                            };
                        });

                    } else {
                        callback(404, {'Error':'Could not read the cart'});
                    };
                });


            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 
};

handlers._cart.delete = (data, callback) => {

    const user = typeof(data.queryStringObject.user) == 'string' && data.queryStringObject.user.trim().length >= 6 ? data.queryStringObject.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {
                
                _data.read('carts', user, (err, userData) => {
                    if (!err && userData) {
                        
                        _data.delete('carts', user, err => {
                            if (!err) {
                                
                                callback(200);

                            } else {
                                callback(400, {'Error': 'Could not delete the specified cart'})
                            }
                        });
        
                    } else {
                        callback(400, {'Error': 'Could not find the specified cart'});
                    };
                });

            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };
            
        });    

    } else {
        callback(400, {'Error': 'Missing required field'});
    };     

};

//---------------- define order handlers


handlers.orders = (data, callback) => {

    const acceptableMethods = ['get', 'post', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method)>-1) {
        handlers._orders[data.method](data, callback)
    } else {
        callback(405);
    };
};

handlers._orders = {};


handlers._orders.post = (data, callback) => {

    const user = typeof(data.payload.user) == 'string' && data.payload.user.length > 0 ? data.payload.user : false;

    if (user) {

        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, user, isTokenvalid => {

            if(isTokenvalid) {

                _data.read('carts', user, (err, data) => {
                    if(!err) {

                        const id = helpers.createNewString(20);
                        const date = Date.now();

                        const orderData = data;
                        orderData.user = user;
                        orderData.id = id;
                        orderData.date = date;

                        _data.create('orders', id, orderData, err => {
                            if(!err) {
/* 
                                let amount = 0;
                                data.items.forEach(element => {
                                    amount += element.price;
                                });

                                helpers.createCharge(amount, err => {
                                    
                                    if (!err) { 
                              
                                        _data.read('users', user, (err, data) => {
                                            if (!err && data) {

                                                const txt = `::Order receipt:: total paid: $${amount} ::thank you!::`;
                                                const email = data.email;

                                                helpers.sendMailgun(email, txt, err => {
                                                    if (!err) {
*/        
                                                        _data.delete('carts', user, err => {

                                                            if (!err) {  
                                                                callback(200);
                                                            } else {
                                                                callback(400, {'Error': 'Could not delete the specified cart'})
                                                            }
                
                                                        });
/*                                                        
                                                    } else {
                                                        callback(500, {'Error': 'Could not send an email'});
                                                    };
                                                });
                                                
                                            } else {
                                                callback(404, {'Error': 'Could not read the user data'});
                                            };
                                        });
                                         
                                    } else {
                                        callback(500, {'Error': 'Could not create a charge'});
                                    }
                                });
*/  
                            } else {
                               callback(500, {'Error': 'Could not create a new order'});
                            }
                        });

                    } else {
                        callback(400, {'Error':'Could not read the cart'});
                    };
                });

            } else {
                callback(400, {'Error': 'Missing required token in header'})
            };

        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }; 
};

//---------------- export module

module.exports = handlers; 