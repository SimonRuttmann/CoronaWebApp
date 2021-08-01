const express = require('express');
const router= express.Router();

const Model1 = require('../models/model1.js');

router.get('/', (req,res) => {
	//Erst machbar sobald die benötigten Daten bekannt sind (Daten-Schema)
     //Returns all matches
	res.send('Dataroute');
});

/*
router.post('/', async (req,res) => {
    //Hier müssen in MySql Userdaten inserted werden
    //req -> JSON {"username":"x","password"="y"}
	const post = new Post({
		titel: req.body.titel
		});
		
	const savedPost = await post.save();	
	res.json(savedPost);
});
*/

module.exports = router;