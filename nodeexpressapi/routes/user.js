const express = require('express');
const router = express.Router();
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt')              //Encrypts the Password by hashing
const flash = require('express-flash')        //Displays messages, if we fail to login. (wrong password, wrong email)
const expresssession = require('express-session')    //Stores and persists session across different pages
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

//Middleware
app.use(express.static('public'));                //Freier Public Ordner
app.use(expresssession({
    secret: "SuperSecretValueToSignSessions",
    resave: false,
    saveUninitialized: false    //Eingeloggte User -> Username -> Sessionobjekt modifiziert -> Session wird erstellt
    //Besucher -> Sessionobjekt wird nicht modifizert -> Session wird nicht erstellt -> Spart Speicherplatz
}))
app.set('view-engine', 'ejs') //View-Engine
app.use(flash())              //Benachrichtigung
app.use(passport.initialize())
app.use(passport.session())

//Routes
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.get('/chat', passport.authenticate('local', {
    successRedirect: "/chat/Authenticated",
    failureRedirect: "/chat/Unauthenticated"
  }))

app.get('/chat/Authenticated', (req,res) =>{

})

app.get('/chat/Unauthenticated', (req,res) => {

})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.get('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        con.on("error", error => { con.connect(); });
        var sqlQuery = "Insert into user (username,password) values ('" + req.body.username + "','" + req.body.password + "')";
        con.query(sqlQuery);

        console.log("Added new User")
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

//DB-Connection
var con = mysql.createConnection({
    host: "sql11.freemysqlhosting.net",
    user: "sql11428172",
    password: "E6Yk3KiNmZ",
    database: "sql11428172"
});

//Authentification Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
    //user ersetzen?
    async function (email, password, done) { 

        con.on("error", error => { con.connect(); });
        var sqlQuery = "SELECT * FROM user where '" + sendKey + "'=username)";
        con.query(sqlQuery, function (err, result, fields) {});

        const user = getUserByEmail(email);
        //done (param1 = Error, param2 = UserFound, param3 = DisplayingMessage)
        console.log("User:"); console.log(user);
        //No User found
        if (user == null) return done(null, false, { message: "Email not used" })
        //User found
        try {
            //Password correct    
            if (await bcrypt.compare(password, user.password)) return done(null, user)

            //Password incorrect
            else return done(null, false, { message: 'Password incorrect' })
        }
        //Error occured
        catch (e) {
            return done(e)
        }

    }
))

//Sessions
//login request -> serialize User 
// session will be established and maintained via a cookie set in the user's browser.
// each following request will not contain credentials, only the cookie   -> ID Check
passport.serializeUser(
    (user, done) => done(null, user.id))

//logout request -> deserialize User    
passport.deserializeUser(
    (id, done) => { return done(null, getUserById(id)) })

//Hilfsfunktionen
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}


function getUserByEmail(email) {
    return users.find(user => user.email === email)
}

function getUserById(id) {
    return users.find(
        (user) => user.id === id)
}

//Exports
module.exports = router;