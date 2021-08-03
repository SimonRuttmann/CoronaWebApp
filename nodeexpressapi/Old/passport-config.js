/*
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
//function authenticateUser (email, passoword, done) {}

function initialize(passport,getUserByEmail, getUserById){
    //done is a function, after authenticating
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email);
        if(user == null){
            return done(null, false), { message: 'No user with that email'};//1st param. error = serverside error, here not the case, 2. param false = no user, 3. param displayed message
        }

        try{
            if(await bcrypt.compare(password, user.password)) {
                return done(null, user)
            }
            else{
                return done(null, false, { message: 'Password incorrect'});
            }
        }
        catch(e) {
                return done(e);
        }


    }
    passport.use(new LocalStrategy(
        {usernameField: 'email'}, 
         authenticateUser));


     passport.serializeUser((user,done) => done(null, user.id)); //store inside session
     
     passport.deserializeUser((id,done) => {
         return done(null, getUserById(id))
        });  //reverse function 


}

module.exports = initialize;
*/

const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email)
    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  })
}

module.exports = initialize