const relDb = require("./dataAccessMySql.js")
const bcrypt = require('bcrypt') 


exports.getUserData =
async function getUserData(req, res){
    var selectQuery = 
    `SELECT name, email, biontech, moderna, astra, johnson, latitude, longitude, city, radius 
     FROM Account 
     WHERE id = ${req.user.id}`
     
     let user = await relDb.getAllUserData(selectQuery);
     
     if(user){
         res.json(user)
     }
     else{
         res.json({valid: false})
     }
}
  


exports.updateUser =
 async function updateUser(req, res){

    var updateQuery = 
    `UPDATE Account
     SET 
     biontech = "${req.body.biontech}", 
     moderna = "${req.body.moderna}", 
     astra = "${req.body.astra}",
     johnson = "${req.body.johnson}",
     latitude = "${req.body.latitude}",
     longitude = "${req.body.longitude}",
     city = "${req.body.city}",
     radius = "${req.body.radius}"
     WHERE  id = "${req.user.id}";`

     let promise = await relDb.updateUserByStatement(updateQuery);

      if(promise){
          res.json(
              {
                  updated: true
              });  
      }
      else{
          res.json(
              {
                  updated: false
              }); 
      }
}



exports.registerUser =
async function registerUser(req, res){
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      var user = {
        id: Date.now().toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      };

      //Query for name

      var selectquery = 
      `SELECT id, name, email, password 
       FROM Account WHERE name = "${user.name}";`;
  
      let existingUserByName = await relDb.getUserDataForSession(selectquery);
      
      //Query for email
      var selectquery = 
      `SELECT id, name, email, password 
       FROM Account WHERE email = "${user.email}";`;
  
      let existingUserByEmail = await relDb.getUserDataForSession(selectquery);
      
      //Create response message, if queries received user
      let existingMessage = null;
      if(existingUserByName && existingUserByEmail) existingMessage = 'Die Email und der Benutzername sind bereits vergeben';
      else if(existingUserByEmail) existingMessage = 'Die Email ist bereits vergeben';
      else if(existingUserByName) existingMessage = 'Der Benutzername ist bereits vergeben';
      

      if(! existingMessage){
        relDb.insertUser(user);
        console.log("redirect to /login")
          res.redirect('/login');     
      }
      else{
          console.log("renderinig")
          res.render('register.ejs', { existingMessage: existingMessage });
          //res.render('index.ejs', { name: req.user.name })
      }
    } catch {
      res.redirect('/register')
    }
}

//Returns data related to the session
exports.getSessionInfo = 
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


//Returns data related to the session and the password 
//(only used by ws-chat)
exports.getCredentials = 
function getCredentials(req, res){
    if(req.isAuthenticated()){
        res.json(
        {
            authenticated: true,
            name: req.user.name,
            email: req.user.email,
            password: req.user.password
        });    
    }
    else{
        res.json(
            {
                authenticated: false
            });    
    }
}


//Used by passport to authentificate the user
exports.getUserByEmail =
async function getUserByEmail(email){
    
    var user;
    var selectQuery = 
    `SELECT id, name, email, password 
     FROM Account WHERE email = "${email}";`;
    user = await relDb.getUserDataForSession(selectQuery);
    return user;
    //users.find(user => user.email === email)
}


//Used by passport by deserializing the session to receive the user
exports.getUserById = 
async function getUserById(id){
    var user;
    var selectQuery = 
    `SELECT id, name, email, password 
     FROM Account WHERE id = "${id}";`;
    user = await relDb.getUserDataForSession(selectQuery);
    return user;
}



// Basic rendering of ejs files

exports.logout = 
function logout(req,res){
    req.logOut();
    res.redirect('/login') 
}

exports.renderNews  =
function renderNews(req,res) {
    res.render('news.ejs') 
}


exports.renderProfile =
function renderProfile(req,res){
    res.render('profile.ejs')
}

exports.renderVaccination =
function renderVaccination(req,res){
    res.render('vaccination.ejs')
}

exports.renderCoronaChat =
function renderCoronaChat(req,res){
    res.render('coronaChat.ejs');
}

exports.renderStatistic = 
function renderStatistic(req,res){
    res.render('statistic.ejs');
}

exports.renderLogin = 
function renderLogin(req,res){
    res.render('login.ejs');
}

exports.renderRegister = 
function renderRegister(req,res){
    res.render('register.ejs')  
}

exports.renderIndex =
 function renderIndex(req,res){
    res.render('index.ejs')
}
