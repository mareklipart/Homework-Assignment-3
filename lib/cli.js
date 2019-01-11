//
//
//get dependencies
//
const readline = require('readline');
const events = require('events');
class _events extends events{};
const e = new _events();
const _data = require('./data');
//
const cli = {};
//
//define handlers events in user input command
//
e.on('man', () => {
    cli.responders.help();
});

e.on('help', () => {
    cli.responders.help();
});

e.on('exit', () => {
    cli.responders.exit();
});

e.on('list menu', () => {
    cli.responders.listMenu();
});

e.on('list orders', () => {
    cli.responders.listOrders();
});

e.on('more order info', (str) => {
    cli.responders.moreOrderInfo(str);
});

e.on('list users', () => {
    cli.responders.listUsers();
});

e.on('more user info', (str) => {
    cli.responders.moreUserInfo(str);
});
//
//
cli.responders = {};
//
// define help handlers
//
cli.responders.help = () => {
    const commands = {
        'exit' : 'Kill the CLI (and the rest of the application)',
        'man' : 'Show this help page',
        'help' : 'Alias of the "man" command',
        'list menu': 'Show a list of all the menu items',
        'list orders': 'Show a list of all the orders placed in the last 24h',
        'more order info --{orderId}' : 'Show details of a specified order',
        'list users': 'Show a list of all the users signed up in the last 24h',
        'more user info --{userId}' : 'Show details of a specified user'
    }
    // Show a header for the help page that is as wide as the screen
    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.verticalSpace(1);

    // Show each command, followed by its explanation, in white and yellow respectively
    for(let key in commands){
        if(commands.hasOwnProperty(key)){
            const value = commands[key];
            let line = '  \x1b[33m '+key+'  \x1b[0m';
            const padding = 45 - line.length;
            for (i = 0; i < padding; i++) {
                line+=' ';
            }
            line+=value;
            console.log(line);
            //cli.verticalSpace();
        }
    }
    cli.verticalSpace(1);
    // End with another horizontal line
    cli.horizontalLine();
};
//

// Create a vertical space
cli.verticalSpace = lines => {
    lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
    for (i = 0; i < lines; i++) {
        console.log('');
    }
  };
  
// Create a horizontal line across the screen
cli.horizontalLine = () => {
// Get the available screen size
    const width = process.stdout.columns;
// Put in enough dashes to go across the screen
    let line = '';
    for (i = 0; i < width - 1; i++) {
        line+='-';
    }
    console.log(line);
};
//
// Create centered text on the screen
cli.centered = str => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
  
    // Get the available screen size
    const width = process.stdout.columns;
  
    // Calculate the left padding there should be
    const leftPadding = Math.floor((width - str.length) / 2);
  
    // Put in left padded spaces before the string itself
    let line = '';
    for (i = 0; i < leftPadding; i++) {
        line+=' ';
    }
    line+= str;
    console.log(line);
  };
  
// define exit command response
cli.responders.exit = () => {
    process.exit(0);
};
//
cli.responders.listMenu = () => {
    _data.read('menu', 'menu', (err, data) => {
        if(!err && data) {
            cli.verticalSpace();
            data.menu.items.forEach(item => console.dir(item, {'colors': true}));
            cli.verticalSpace();
        }
    });
};
// define list orders command response
cli.responders.listOrders = () => {
    _data.list('orders', (err, ordersData) => {
        if(!err && ordersData && ordersData.length>0) {
            cli.verticalSpace();
            ordersData.forEach(orderId => {
                _data.read('orders', orderId, (err, orderData) => {
                    if (orderData.date > Date.now() - 1000 * 60 * 60 * 24) {
                        if(!err && orderData) {
                            let line = 'ID: ' + orderData.id + ' ' + 'USER: ' + orderData.user;
                            console.log(line);
                            cli.verticalSpace(); 
                        }
                    } else {
                        console.log('No orders found');
                    }
                 });
            });
        }
    });
};
// define order info command response
cli.responders.moreOrderInfo = (str) => {
    const arr = str.split('--');
    const orderId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if(orderId) {
        _data.read('orders', orderId, (err, orderData) => {
            if(!err && orderData) {
                cli.verticalSpace();
                orderData.items.forEach(item => console.dir(item, {'colors': true}));
                cli.verticalSpace(); 
            }
        });
    };
};
// define list users command response
cli.responders.listUsers = () => {
    _data.list('users', (err, usersData) => {
        if(!err && usersData && usersData.length > 0) {
            cli.verticalSpace();
            usersData.forEach(user => {
                _data.read('users', user, (err, userData) => {
                    delete userData.password;
                    if (userData.lastLogged > Date.now() - 1000 * 60 * 60 * 24) {
                        if(!err && userData) {
                            let line = 'NAME: ' + userData.name + ' ' + 'USER: ' + userData.user;
                            console.log(line);
                            cli.verticalSpace(); 
                        }
                    } else {
                        console.log('No orders found');
                    }
                })
            })
        }
    });
};
// define user info command response
cli.responders.moreUserInfo = (str) => {
    const arr = str.split('--');
    const email = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if(email) {
        _data.list('users', (err, usersData) => {
            if(!err && usersData && usersData.length > 0) {
                cli.verticalSpace();
                usersData.forEach(user => {
                    _data.read('users', user, (err, user) => {
                        if(!err && user) {
                            delete user.password;
                            if(user.email == email) {
                                console.log(`NAME: ${user.name} ADDRESS: ${user.streetAddress} USERNAME: ${user.user}`);
                                cli.verticalSpace();
                            }
                        }
                    })
                })
            }
        });
    }    
};
//
// define event in user choice input
cli.processInput = (str) => {
    str = typeof(str) == 'string' && str.length > 0 ? str.trim() : false;
    //
    if(str) {
        const uniqueInputs = [
            'man',
            'help',
            'exit',
            'list menu',
            'list orders',
            'more order info',
            'list users',
            'more user info',
        ];
        //
        let matchFound = false;
        //
        uniqueInputs.some(input => {
            if(str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                e.emit(input, str);
                return true;
            };
        });
        //
        if(!matchFound) {
            console.log('Sorry, wrong input, try again');
        }
    };
};
// init function
cli.init = () => {
    console.log('\x1b[34m%s\x1b[0m','The CLI is running');
    //
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
    });
    _interface.prompt();
    //
    _interface.on('line', (str) => {
        cli.processInput(str);
        _interface.prompt();
    });
    //
    _interface.on('close', () => {
        process.exit(0);
    });

}



module.exports = cli;