const path = require("path")
const express = require("express")
const bodyparser = require("body-parser")
const pug = require("pug")
const request = require("request")
// const AWS = require("aws-sdk")
const app = express() 
const stategen = require('./stategen')

var code;
console.log("code")
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, '/')))
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: false }))

var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

// Starting page
app.get('/', function(req, res, next) {
    res.status(200)
    app.set('state', stategen()) // Set state variable
    res.render('index', { 
        action: '/authcode', 
        method: 'GET',
        bType: 'primary', 
        message: 'Go!' 
    })
})

// Button is pressed on starting page to take user to Google
// authorization page
app.get('/authcode', function (req, res, next) {
    var state = app.get('state')
    var qs = {
        response_type: 'code',
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        scope: 'email',
        state: state
    }
    request({
        url: GOOGLE_AUTH_URL,
        qs: qs
    }).pipe(res)
})

// When code is received from Google, return to this page
// to get token
app.get('/oauth', function (req, res, next) {
    // If state variable doesn't match, render error message
    if (req.query.state != app.get('state')) {
        res.render('index', {
            action: '/',
            method: 'GET',
            bType: 'danger',
            message: 'Uh oh. State mismatch. Try again.'
        })
    }
    
    // If code hasn't yet been received, render 'code received' and
    // set up to receive token
    if (!code) {
        console.log("getting token")
        code = req.query.code
        res.render('index', { 
            action: '/oauth',
            method: 'POST',
            bType: 'success', 
            message: 'Code Received. Get Token.'
        })
    }
})

// POST code to get token from Google
app.post('/oauth', function(req, res, next) {
    // var tokenBody
    var url = 'https://accounts.google.com/o/oauth2/token';
    var payload = {
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code'
    };
    
    // If token hasn't been received POST to get token
    if (!app.get('tokenBody')) {
        request.post(url, { form: payload }, function(error, response, body){
            // tokenBody = body
            app.set('tokenBody', JSON.parse(body))
        })
        
        // Once received prepare to get user info
        res.render('index', { 
            action: '/email',
            method: 'GET',
            bType: 'primary', 
            message: 'Token Received. Get Info.'
        })
    } else {
        console.log("something went wrong")
    }
})

// GET request to get user info once token is received
app.get('/email', function(req, res, next) {
    var tb = app.get('tokenBody')
    var options = {
        url: 'https://www.googleapis.com/userinfo/v2/me',
        headers: {
            'Authorization': 'Bearer ' + tb['access_token']
        }
    }
    
    // Render user info to page
    request(options, function(err, response, body) {
        var b = JSON.parse(body)
        console.log(body)
        res.render('index', { 
            action: '/',
            email: 'Your name is ' + b['name'],
            gpaccount: 'Your Google Plus link is ' + b['link'],
            statevar: 'The state variable was ' + app.get('state'),
            bType: 'succes', 
            message: 'Done!'
        })
    })

    // Reset token
    app.set('tokenBody', null)
    code = null
    
})

var port = process.env.PORT || 8080
app.listen(port, function() {
    console.log("Listening");
})
