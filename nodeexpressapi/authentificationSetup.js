//Configuration based on the official documentation: 
//http://www.passportjs.org/docs/authenticate/


const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const controller = require("./controller")
var passport;

//Called once at serverstart
exports.initializePassport =
function initializePassport(passportFromServer){
    passport=passportFromServer;
    setupStrategy(passport);
    setupSerialize(passport);
    setupDeserialize(passport);
}


//Sets up the strategy used by passport
//Creation of sessions (log-in) are made due to queries on the mySql Database
function setupStrategy(passport){
    passport.use(new LocalStrategy({
        usernameField: 'email', 
        passwordField: 'password'},
    
        async function (email, password, done){
            const user = await controller.getUserByEmail(email);
                                                                          //done (param1 = Error, param2 = UserFound, param3 = DisplayingMessage)
                                                                          
            //No User found
            if(user == null)                                              return done(null, false, {message: "Kein Benutzer unter dieser Email"} )            
            //User found
            try {
                  //Password correct    
                  if (await bcrypt.compare(password, user.password))      return done(null, user)
    
                  //Password incorrect
                  else                                                    return done(null, false, { message: 'Password inkorrekt' } )
              }
             //Error occured
            catch (e) {
                                                                          return done(e)
            }
    
        }
    ))
}

//Serializes the user by only saving his id
//helds the created session small
function setupSerialize(passport){
    passport.serializeUser(
        (user, done) => done(null, user.id))
}

//Deserialization of the session by querying the db
function setupDeserialize(passport){
    passport.deserializeUser(
        async(id, done) => {
            var user = await controller.getUserById(id); 
            return done(null, user) 
      } )   
}


exports.loginAuth = 
function loginAuth(req,res,next){
    passport.authenticate('local', {
        successRedirect : '/',
        failureRedirect : '/login',
        failureFlash : true
    })(req,res)    
}


exports.checkAuthenticated = 
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
}
  

exports.checkNotAuthenticated =
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }

    next()
}


    