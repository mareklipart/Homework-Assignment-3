//
//
const app = {};
//
//
app.client = {};
//
//
app.config = {
    'sessionToken': false,
};
//
// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

    // Set defaults
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;
  
    // For each query string parameter sent, add it to the path
    var requestUrl = path+'?';
    var counter = 0;
    for(var queryKey in queryStringObject){
       if(queryStringObject.hasOwnProperty(queryKey)){
         counter++;
         // If at least one query string parameter has already been added, preprend new ones with an ampersand
         if(counter > 1){
           requestUrl+='&';
         }
         // Add the key and value
         requestUrl+=queryKey+'='+queryStringObject[queryKey];
       }
    }
    
    // Form the http request as a JSON type
    var xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-type", "application/json");
  
    // For each header sent, add it to the request
    for(var headerKey in headers){
       if(headers.hasOwnProperty(headerKey)){
         xhr.setRequestHeader(headerKey, headers[headerKey]);
       }
    }
  
    // If there is a current session token set, add that as a header
    if(app.config.sessionToken){
      xhr.setRequestHeader("token", app.config.sessionToken.id);
    }
  
    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
          var statusCode = xhr.status;
          var responseReturned = xhr.responseText;
  
          // Callback if requested
          if(callback){
            try{
              var parsedResponse = JSON.parse(responseReturned);
              callback(statusCode,parsedResponse);
            } catch(e){
              callback(statusCode,false);
            }
  
          }
        }
    }
  
    // Send the payload as JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
  
  };
//
//
app.loadPageContent = () => {
// load conent of index page in main tag class function
    let page = document.querySelector('main').id;
    page = typeof(page) == 'string' && page.length > 0 ? page : false;

    if (page) {
        switch(page) {
            case 'menuList': app.loadMenuContent();
            break;
            case 'accountCreate': app.loadAccountContent(page);
            break;
            case 'sessionCreate': app.loadAccountContent(page);
            break;
            case 'cartCreate': app.loadCartContent();
            break;
            case 'orderCreate': app.loadOrderContent();
            break;
        };
    };
};
//
//
app.loadMenuContent = () => {
// load meu constent
    const user = typeof(app.config.sessionToken.user) == 'string' ? app.config.sessionToken.user : false;

    if (user) {

        const queryStringObject = {
            'user': user
        };

        const table = document.querySelector('#menuTable');
// get menu items
        app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
            if (statusCode == 200) {

                responsePayload.menu.items.forEach(element => {
                    const tr = table.insertRow(-1);
                    tr.classList.add('menuRow');
                    var td0 = tr.insertCell(0);
                    var td1 = tr.insertCell(1);
                    var td2 = tr.insertCell(2);
                    td0.innerHTML = element.name
                    td1.innerHTML = '$' + element.price;
                    td2.innerHTML = '<input type="button" value="add to cart" id="'+element.id+'" onClick="app.addToCart(this)">';

                });
//set items behavior if already clicked and added to cart
                app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
                    if (statusCode == 200 ) {

                        const inputList = document.querySelectorAll('input');
                        inputList.forEach(itemInput => {

                            responsePayload.items.forEach(itemCart => {
                                if (itemInput.id == itemCart.id) {
                                    itemInput.value = 'added';
                                    itemInput.disabled = true;
                                };
                            });
                        });

                    } else {
                        statusCode !== 404 ? app.logUserOut() : null;
                    };
                });
            } else {
                app.logUserOut();
            };
        });
    } else {
        app.logUserOut();
    };
};
//
//
app.addToCart = e => {
// add item to the cart 
    const user = typeof(app.config.sessionToken.user) == 'string' ? app.config.sessionToken.user : false;

    if (user) {
        e.disabled = true;
        e.value = 'added';

        const listToAdd = document.querySelectorAll('input');
        const items = [];

        listToAdd.forEach(element => {
            if(element.disabled) {
                items.push(element.id);
            };
        });

        const payload = {
            'user': user,
            'items': items
        }
// add item to the cart data       
        app.client.request(undefined,'api/cart','PUT',undefined,payload,(statusCode,responsePayload) => {
            if(statusCode == 404) {
                app.client.request(undefined,'api/cart','POST',undefined,payload,(statusCode,responsePayload) => {
                    if(statusCode !== 200) {
                        e.disabled = false; e.value = 'add to cart';
                    };
                });
            } else {
                if (statusCode !== 200) {
                    e.disabled = false; e.value = 'add to cart';
                }
            };
        });
    } else {
        app.logUserOut();
    };
};
//
//
app.loadCartContent = () => {
// load cart content
    const user = typeof(app.config.sessionToken.user) == 'string' ? app.config.sessionToken.user : false;

    if (user) {

        const queryStringObject = {
            'user': user
        };
        const table = document.querySelector('#cartTable');
        let total = 0;
// get cart content
        app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
            if (statusCode == 404) {
                document.querySelector(".formError").innerHTML = 'Your cart is empty, please <a class="navMenuLink" href="/">add</a> items to!';
                document.querySelector(".check").style.display = 'none';
            } else if (statusCode !==200 ) {
                document.querySelector(".formError").innerHTML = responsePayload.Error;
            } else {
 
                responsePayload.items.forEach(element => {
                    const tr = table.insertRow(-1);
                    tr.classList.add('menuRow');
                    const td0 = tr.insertCell(0);
                    const td1 = tr.insertCell(1);
                    const td2 = tr.insertCell(2);
                    td0.innerHTML = element.name;
                    td1.innerHTML = '$' + element.price;
                    td2.innerHTML = '<input type="button" value="remove" id="'+element.id+'" onClick="app.removeCartItem(this)">';
                    total += element.price;
                });
                const tr = table.insertRow(-1);
                tr.classList.add('menuRow1');
                const td0 = tr.insertCell(0);
                const td1 = tr.insertCell(1);
                const td2 = tr.insertCell(2);
                td1.innerHTML = '$' + total;
                td0.innerHTML = 'total';
            };
        });
    };
};
//
//
app.removeCartItem = e => {
    const user = typeof(app.config.sessionToken.user) == 'string' ? app.config.sessionToken.user : false;
// remove cart item from cart list
    if (user) {
        const items = [];
        const itemsList = document.querySelectorAll('input');
        itemsList.forEach(element => {
            if (element.id != e.id) {
                items.push(element.id);
            }
        });

        const payload = {
            'items': items,
            'user': user
        };

        const queryStringObject = {
            'user': user
        };
        if (payload.items.length > 0) {
            app.client.request(undefined,'api/cart','PUT',undefined,payload,(statusCode,responsePayload) => {
                if (statusCode == 200) {
                    document.querySelector('#cartTable').innerHTML = '';
                    app.loadCartContent();
                } else {
                    document.querySelector(".formError").innerHTML = responsePayload.Error;
                };
            });
        } else {
            app.client.request(undefined,'api/cart','DELETE',queryStringObject,undefined,(statusCode,responsePayload) => {
                if (statusCode == 200) {
                    document.querySelector('#cartTable').innerHTML = '';
                    app.loadCartContent();
                } else {
                    document.querySelector(".formError").innerHTML = responsePayload.Error;
                };
            });
        };   
    };
};
//
//
app.loadAccountContent = (page) => {
// load account form
    if (document.querySelector("form")) {

        const form = document.querySelector("form");
        form.addEventListener("submit", e => {

            e.preventDefault();
            const path = form.action;
            const method = form.method.toUpperCase();
            const elements = form.elements;
            const payload = {};

            // Hide the error message (if it's currently shown due to a previous error)
            document.querySelector(".formError").style.display = 'none';

            // Hide the success message (if it's currently shown due to a previous error)
            if(document.querySelector(".formSuccess")){
            document.querySelector(".formSuccess").style.display = 'none';
            }

            for (let i=0; i<elements.length; i++) {
                if (elements[i].type !== 'submit') {
                    payloadKey = elements[i].name;
                    payload[payloadKey] = elements[i].value;
                };
            };
// set user or token endpoint
            app.client.request(undefined,path,method,undefined,payload,(statusCode,responsePayload) => {
                if(statusCode !== 200) {
                        // Try to get the error from the api, or set a default error message
                        const error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

                        // Set the formError field with the error text
                        document.querySelector(".formError").innerHTML = error;

                        // Show (unhide) the form error field on the form
                        document.querySelector(".formError").style.display = 'block';
                } else {
                    app.formResponse(page, payload, responsePayload);
                };
            });
        });
    };
};
//
//
app.loadOrderContent = () => {
// load order page    
    const user = typeof(app.config.sessionToken.user) == 'string' ? app.config.sessionToken.user : false;

    if (user) {

        const queryStringObject = {
            'user': user
        };
        const table = document.querySelector('#cartTable');
        let total = 0;

        app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
            if (statusCode !==200 ) {
                app.logUserOut();
            } else {
                
                responsePayload.items.forEach(element => {
                    const tr = table.insertRow(-1);
                    tr.classList.add('menuRow');
                    const td0 = tr.insertCell(0);
                    const td1 = tr.insertCell(1);
                    td0.innerHTML = element.name;
                    td1.innerHTML = '$' + element.price;
                    total += element.price;
                });
                const tr = table.insertRow(-1);
                tr.classList.add('menuRow1');
                const td0 = tr.insertCell(0);
                const td1 = tr.insertCell(1);
                td1.innerHTML = '$' + total;
                td0.innerHTML = 'total';
            };
        });
    };
};
//
//
app.bindAbortOrder = () => {
// bind abort order button
    const button = document.querySelector('.abort');
    if (button) {
        button.addEventListener('click', e => {
            e.preventDefault();
            window.location = '/';
        });
    };
};
//
//
app.bindCheckOrder = () => {
// bind payment button
    const button = document.querySelector('.orderCheck');
    if (button) {
        button.addEventListener('click', e => {

            e.preventDefault();

            const user = typeof(app.config.sessionToken.user) == 'string' ? app.config.sessionToken.user : false;

            if (user) {
        
                const payload = {
                    'user': user
                };
                const table = document.querySelector('#cartTable');
        
                app.client.request(undefined,'api/orders','POST',undefined,payload,(statusCode,responsePayload) => {
                    if (statusCode !==200 ) {
        
                        const error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';
                        document.querySelector(".formError").innerHTML = error;
        
                    } else {
                        
                        document.querySelector(".formSuccess").innerHTML = 'The payment is done. The invoice has been sent to your email address';
                        table.innerHTML = '';
                    };
                });
            };
        });
    };
};
//
//
app.formResponse = (page, requestPayload, responsePayload) => {
// create session token and web storage token
    if (page == 'accountCreate') {
        const newPayload = {
            'user': requestPayload.user,
            'password': requestPayload.password
        };
        app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload, (statusCode, responsePayload) => {
            if (statusCode !== 200) {
                // Set the formError field with the error text
                document.querySelector(".formError").innerHTML = 'Sorry, an error has occured. Please try again.';

                // Show (unhide) the form error field on the form
                document.querySelector(".formError").style.display = 'block';
            } else {
                app.setSessionToken(responsePayload);
                window.location = '/';
            };
        });        
    };
    if (page == 'sessionCreate') {
        app.setSessionToken(responsePayload);
        window.location = '/';
    };
};
//
//
app.setSessionToken = (token) => {
// set the session token in web storage
    app.config.sessionToken = token;
    var tokenString = JSON.stringify(token);
    localStorage.setItem('token',tokenString);
    if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
    } else {
        app.setLoggedInClass(false);
    };
};
//
//
app.getSessionToken = () => {
// get seesion token    
    const tokenString = localStorage.getItem('token');
    if(typeof(tokenString) == 'string'){
        try {
            const token = JSON.parse(tokenString);
            app.config.sessionToken = token;
            if(typeof(token) == 'object'){
                app.setLoggedInClass(true);
            } else {
                app.setLoggedInClass(false);
            };
        } catch (e) {
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        };
    };
};
//
//
app.setLoggedInClass = (add) => {
// set navigation button visibility    
    const classLogInList = document.querySelectorAll('.loggedIn');
    const classLogOutList = document.querySelectorAll('.loggedOut');
       
    if (add && classLogInList) {
        classLogOutList.forEach(element => {
            element.style.display = 'none';
        });
        classLogInList.forEach(element => {
            element.style.display = 'block';
        });
    } else {
        classLogOutList.forEach(element => {
            element.style.display = 'block';
        });
        classLogInList.forEach(element => {
            element.style.display = 'none';
        });

    };
};
//
//
// Log the user out then redirect them
app.logUserOut = () => {
  
    // Get the current token id
    const tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
  
    // Send the current token to the tokens endpoint to delete it
    var queryStringObject = {
      'id' : tokenId
    };
    app.client.request(undefined,'api/tokens','DELETE',queryStringObject,undefined,(statusCode,responsePayload) => {
      // Set the app.config token as false
      app.setSessionToken(false);
      // Send the user to the logged out page
      if (window.location.pathname !== '/') {
            window.location = '/';
      };
    });
  };
//
//
app.bindLogoutButton = () => {
    document.getElementById("logoutButton").addEventListener("click", (e) => {
  
      // Stop it from redirecting anywhere
      e.preventDefault();
  
      // Log the user out
      app.logUserOut();
  
    });
  };
//
//
// Renew the token
app.renewToken = (callback) => {
    const currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
    if (currentToken) {
      // Update the token with a new expiration
      const payload = {
        'id' : currentToken.id,
        'extend' : true,
      };
      app.client.request(undefined,'api/tokens','PUT',undefined,payload,(statusCode,responsePayload) => {
        // Display an error on the form if needed
        if(statusCode == 200){
          // Get the new token details
          var queryStringObject = {'id' : currentToken.id};
          app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined,(statusCode,responsePayload) => {
            // Display an error on the form if needed
            if(statusCode == 200){
              app.setSessionToken(responsePayload);
              callback(false);
            } else {
              app.setSessionToken(false);
              callback(true);
            }
          });
        } else {
          app.setSessionToken(false);
          callback(true);
        }
      });
    } else {
      app.setSessionToken(false);
      callback(true);
    }
  };
//
// Loop to renew token often
app.tokenRenewalLoop = () => {
    setInterval( () => {
        app.renewToken( (err) => {
            if (!err){
                console.log("Token renewed successfully @ "+Date.now());
            }
        });
    },1000 * 60);
};
//
//
app.init = () => {
    app.getSessionToken();
    app.bindLogoutButton();
    app.loadPageContent();
    app.tokenRenewalLoop();
    app.bindAbortOrder();
    app.bindCheckOrder();
};
//
//
window.onload = () => {
    app.init();
}; 