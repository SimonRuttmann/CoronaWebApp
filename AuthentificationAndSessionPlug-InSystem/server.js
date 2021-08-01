
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
const mysql = require('mysql');
const app = express()
app.use(express.json());
//hier sind alle user drin -> DB
const users = []

//DB-Connection
var con = mysql.createConnection({
    host: "sql11.freemysqlhosting.net",
    user: "sql11428172",
    password: "E6Yk3KiNmZ",
    database: "sql11428172"
});


//Doku: http://www.passportjs.org/docs/authenticate/
  //Configuration

  //1. Authentification Strategy
  const passport = require('passport')
  const LocalStrategy = require('passport-local').Strategy;


  
  passport.use(new LocalStrategy({
      usernameField: 'email', 
      passwordField: 'password'},

      async function (email, password, done){
          const user = await getUserByEmail(email);
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
      async(id, done) => {
          var user = await getUserById(id); 
          return done(null, user) 
    } )


/* Seiten:
    index.ejs
    login.ejs       // logout
    register.ejs
    statistic.ejs
    coronaChat.ejs
    vaccination.ejs
    news.ejs
    profile.ejs
*/

  //Routes
  //        Get Requests
  /*app.get('/', checkAuthenticated, (req, res) => {
    console.log(req.session)
    console.log(req.user)
    res.render('index.ejs', { name: req.user.name })

  })
  */
 app.get('/', (req,res) => {
     res.render('index.ejs')
 })
  
  app.get('/index', (req,res) => {
      res.render('index.ejs');
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

app.get('/statistic', (req,res) =>{
    res.render('statistic.ejs')
})

app.get('/coronaChat', (req,res) =>{
    res.render('coronaChat.ejs')
})

app.get('/vaccination', (req,res) =>{
    res.render('vaccination.ejs')
})

app.get('/news', (req,res)=>{
    res.render('news.ejs')
})

app.get('/profile', (req,res) =>{
    res.render('profile.ejs')
})

//Get Credentials
app.get('/user/getSessionInfo',getSessionInfo);

/*
{
    authenticated: "true"
    name: "albert"
    email: "albert@albert.com"
}
*/
function getSessionInfo(req, res){
    if(req.isAuthenticated()){
        res.json(
        {
            authenticated: true,
            name: req.user.name,
            email: req.user.email
        });    
    }
    else{
        res.json(
            {
                authenticated: false
            });    
    }
}
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
      var user = {
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      };
      console.log("t1")
      console.log(user)
      insertUser(user);    
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
  
//Tabelle User:                                         Default
//  id              11021998                            notnull         PRIMARY KEY
//  name            Albert                              notnull         unique
//  email           alber@albert.com                    notnull         unique
//  password        3243jjk2lj3r3lk2rjl2rjd             notnull
//  gender          m                                   unkown,         male, female, diverse
//  priority        1                                   priority4,      priority3, priority2, priority1
//  prefVaccine     bioentech                           everything,     biontech, moderna, astra, johnson
//  district        heidenheim                          unknown         --
//  radius          all, surrounding, one               all             one, surrounding
/*
CREATE TABLE IF NOT EXISTS Account (
    id          VARCHAR(255),
    name        VARCHAR(255) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    gender      ENUM('unkown', 'male', 'female', 'diverse')  DEFAULT 'unknown', 
    priortiy    VARCHAR(30)  DEFAULT 'priority4',
    prefVaccine VARCHAR(50)  DEFAULT 'everything',
    district    VARCHAR(255) DEFAULT 'unkown',
    radius      ENUM('all', 'surrounding', 'one')  DEFAULT 'all',   
    PRIMARY KEY (id)
);

*/

  function createAccountTable(){
    var tableQuery = 
    `CREATE TABLE IF NOT EXISTS Account (                                                  
        id          VARCHAR(255),
        name        VARCHAR(255) NOT NULL UNIQUE,
        email       VARCHAR(255) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        gender      ENUM('unknown', 'male', 'female', 'diverse')  DEFAULT 'unknown', 
        priortiy    VARCHAR(30)  DEFAULT 'priority4',
        prefVaccine VARCHAR(50)  DEFAULT 'everything',
        district    VARCHAR(255) DEFAULT 'unkown',
        radius      ENUM('all', 'surrounding', 'one')  DEFAULT 'all',   
        PRIMARY KEY (id)
    )`
    con.query(tableQuery);
  }
  //createAccountTable();

  function insertUser(user){
    con.on("error", error => { con.connect(); });
    var insertQuery = 
    `INSERT INTO Account(id, name, email, password) VALUES ("${user.id}", "${user.name}", "${user.email}", "${user.password}");`;

    try{
        con.query(insertQuery);
    }
    catch(e){
        console.log("Error at inserting User: " + user);
        console.log(e);
    }
  }
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
    
 // var user = {
 //   id: Date.now().toString(),
 //   name: req.body.name,
 //   email: req.body.email,
 //   password: hashedPassword
 // };
async function getUserByEmail(email){
    
    var user;
    var selectQuery = 
    `SELECT id, name, email, password 
     FROM Account WHERE email = "${email}";`;
    user = await getUserFromMySql(selectQuery);
    return user;
    //users.find(user => user.email === email)
}
//User
async function getUserById(id){
    var user;
    var selectQuery = 
    `SELECT id, name, email, password 
     FROM Account WHERE id = "${id}";`;
    user = await getUserFromMySql(selectQuery);
    return user;
}

function getUserFromMySql(selectQuery){

    return new Promise( (resolve, reject) => {
        con.on("error", error => { con.connect(); });
        var user;
        
            con.query(selectQuery, function (err, resultrows, fields) {
                if (err){ 
                    reject(err);
                }
                else if (resultrows.length == 0){
                    resolve(null);
                }
                else{     
                    user = {
                        id: resultrows[0].id,
                        name: resultrows[0].name,
                        email: resultrows[0].email,
                        password: resultrows[0].password
                    };
                    resolve(user);
                }
            });
        
    })
}


  app.listen(3000, () => {
      console.log("Server listens at Port 3000")
  })