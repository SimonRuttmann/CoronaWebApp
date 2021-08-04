const express = require("express")
const controller = require("./controller.js")
const authenticate = require("./authentificationSetup")
const router = express.Router();

/*                  Get-Requets with only authentification and rendering                */

/*  No authentification allowed / no active session    */

router.get('/login', authenticate.checkNotAuthenticated, controller.renderLogin)
 
router.get('/register', authenticate.checkNotAuthenticated, controller.renderRegister)

router.get('/', controller.renderIndex)

router.get('/index', controller.renderIndex)
  
/*  Open Sites with or without authentification  */
router.get('/statistic', controller.renderStatistic)

router.get('/coronaChat', controller.renderCoronaChat)

router.get('/vaccination', controller.renderVaccination)

router.get('/news', controller.renderNews)

router.get('/logout', controller.logout)

/*  Site only allowed with authentification   */
router.get('/profile', authenticate.checkAuthenticated, controller.renderProfile)


/*                                  Routes for AJAX-Requests                               */
router.get('/user/getSessionInfo',controller.getSessionInfo);  
//Example response:
//{
//    authenticated:    true,
//    name:             'testuser1',
//    email:            'testuser@mail.com'                      
//}

router.get('/user/getUserData', authenticate.checkAuthenticated, controller.getUserData)
//Exampe respone:
//{
//  name:           'testuser1',
//  email:          'testuser@mail.com'
//  gender:         'male'
//  priority:       'priority4'
//  perfVaccine:    'moderna'
//  district:       'Heidenheim'
//  radius:         'all'  
//}

router.post('/user/updateUser', authenticate.checkAuthenticated, controller.updateUser)
//Expects as input:
//{
//  gender:         'male'
//  priority:       'priority4'
//  perfVaccine:    'moderna'
//  district:       'Heidenheim'
//  radius:         'all'     
//}


/*                  Authentification & Session over passport local startegy                */
router.post('/login', authenticate.checkNotAuthenticated, authenticate.loginAuth)
//Redirects an sucess (correct email and username)
//Error-Messages at failure (email not in use or password incorrect)

router.post('/register', authenticate.checkNotAuthenticated, controller.registerUser)
// Redirects at success (email and username are not already in use)
//Error-Messages at failure (email in use, username in use, both in use)

module.exports = router;

