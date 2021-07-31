
// npm install ejs                      Render Engine
// npm install bcrypt                   Hashing
// npm i passport passport-local        Check username and passwort and ==> Perist user between all requests
// npm i session                        store and persist user across diffrent pages
// npm i express-flash                  display messages if we fail to login    wrong passwort, wrong email

  const express = require('express')
  const bcrypt = require('bcrypt')              //Encrypts the Password by hashing
  const flash = require('express-flash')        //Displays messages, if we fail to login. (wrong password, wrong email)
  const expresssession = require('express-session')    //Stores and persists session across different pages
                                                //Render Engine
  
const app = express()
app.use(express.json());
//hier sind alle user drin -> DB
const users = []

//Doku: http://www.passportjs.org/docs/authenticate/
  //Configuration

  //1. Authentification Strategy
  const passport = require('passport')
  const LocalStrategy = require('passport-local').Strategy

  
  passport.use(new LocalStrategy({
      usernameField: 'email', 
      passwordField: 'password'},

      async function (email, password, done){
          const user = getUserByEmail(email);
                                                                        //done (param1 = Error, param2 = UserFound, param3 = DisplayingMessage)
                                                                        console.log("User:" );console.log(user);
          //No User found
          if(user == null)                                              return done(null, false, {message: "Email not used"} )            
          //User found
          try {
                //Password correct    
                if (await bcrypt.compare(password, user.password))      return done(null, user)

                //Password incorrect
                else                                                    return done(null, false, { message: 'Password incorrect' } )
            }
           //Error occured
          catch (e) {
                                                                        return done(e)
          }

      }
  ))

  //2. Middleware
  app.use(express.static('public'));                //Freier Public Ordner
  app.use(express.static(__dirname + '/public'));
  app.use(expresssession({
    secret: "SuperSecretValueToSignSessions",
    resave: false,
    saveUninitialized: false    //Eingeloggte User -> Username -> Sessionobjekt modifiziert -> Session wird erstellt
                                //Besucher -> Sessionobjekt wird nicht modifizert -> Session wird nicht erstellt -> Spart Speicherplatz
    }))
  app.use(express.urlencoded({ extended: false }))  //Notwendig für get und post
  app.set('view-engine', 'ejs') //View-Engine
  app.use(flash())              //Benachrichtigung
  app.use(passport.initialize())
  app.use(passport.session())
  
  
  //3. Sessions
  //login request -> serialize User 
  // session will be established and maintained via a cookie set in the user's browser.
  // each following request will not contain credentials, only the cookie   -> ID Check
  passport.serializeUser(
      (user, done) => done(null, user.id))

  //logout request -> deserialize User    
  passport.deserializeUser(
      (id, done) => { return done(null, getUserById(id)) } )



  //Routes
  //        Get Requests
  app.get('/', checkAuthenticated, (req, res) => {
    console.log(req.session)
    console.log(req.user)
    res.render('index.ejs', { name: req.user.name })

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
  
  //app.get('/chat', passport.authenticate('local', {
  //  successRedirect: "/chat/Authenticated",
  //  failureRedirect: "/chat/Unauthenticated"
  //}))
  
app.get('/coronaChat', (req,res) =>{
    res.render('coronaChat.ejs')
})

app.get('/statistic', (req,res) =>{
    res.render('statistic.ejs')
})

app.get('/userprofile', (req,res) =>{
    res.render('userprofile.ejs')
})

app.get('/vaccination', (req,res) =>{
    res.render('vaccination.ejs')
})


  //        Post Requests
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.post('/register', checkNotAuthenticated, async (req, res) => {
    //console.log(req);
    console.log(req.body);
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      })
      console.log("Added new User, all Users: ")
      console.log(users)
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }
  })
  

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
  

function getUserByEmail(email){
    return users.find(user => user.email === email)
}

function getUserById(id){
    return users.find(
        (user) => user.id === id)
}


  app.listen(3000, () => {
      console.log("Server listens at Port 3000")
  })