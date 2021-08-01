const express = require('express');
const router= express.Router();
const MongoDB = require('../db.js');
const Model1 = require('../models/model1.js');


//Alternativ Databaseaccess for /overview
router.get('/',async (req,res) => {
     	//Returns all matches
     	const ans=await MongoDB.find("","datas"); //Anpassen an DB
	res.send(ans);
});


router.get('/overview',async (req,res) => {
	const db_get =await Model1.find();
	const response={
		"infizierte": db_get[0].infizierte,
		"genesen": db_get.genesen,
		"geimpft": db_get.geimpft,
		"immun": db_get.immun,
		"todesfaelle": db_get.todesfaelle
	};
	res.send(response);
});

//Schickt die Daten für alle Districte oder für eines mit Parameterangabe(angabe mit /?var=val)
router.get('/district',async (req,res) => {
	var param=req.query.district;
	var response;
	if(param==null){
		const dbData= await MongoDB.find("{}","datas");
		console.log(dbData)
		
		response = '{"Landkreise":[';
		for(var i in dbData){
			response = response +
				'{"Landkreis":"'+dbData[i].titel+
				'","Infizierte":"'+dbData[i].titel+
        			'","genesen":"'+dbData[i].titel+
        			'","geimpft":"'+dbData[i].titel+
        			'","immune":"'+dbData[i].titel+ 
        			'","todesfaelle":"'+dbData[i].titel+ 
        			'","gesamtbevoelkerung":"'+dbData[i].titel+
        			'","inzidenz":"'+dbData[i].titel+
        			'"},'
		}
		response=response.slice(0,-1)+"]}"
		console.log(response);
		response=JSON.parse(response);
	}
	
	else{
	 	param=JSON.parse('{"infizierte":'+param+'}'); //Anpassen an DB-Form
		const dbData=await MongoDB.find(param,"datas")
		console.log(dbData.length)
		if(dbData.length==0){
		 	res.send("No Data found");
		 	return;
		};
		response={ 
			"Genesene_pro_Woche":dbData[0].infizierte,
        		"todesfälle_Weiblich":dbData,
        		"todesfälle_Männlich":dbData,
        		"todesfälle_Altergruppe1":dbData,
        		"todesfälle_Altersgruppe2":dbData, 
        		"Tote_pro_Woche":dbData, 
        		"Fälle_pro_Woche":dbData,
        		"Bevölkerung_pro_Woche":dbData,
        		"Impfangebote_pro_Woche":dbData,
        		"Geimpte_pro_Woche":dbData,
        		"Inzidenz_pro_Woche":dbData 
		};
		
	};
	res.send(response);	
});

//Entfernen, reine Testmethode
router.post('/insert',async (req,res) => {
	const model=new Model1({
		infizierte: req.body.infizierte,
		genesen: req.body.genesen,
		geimpft: req.body.geimpft,
		immun: req.body.immun,
		todesfaelle: req.body.todesfaelle
	})
	var saved = await model.save();
	res.json(saved);
});


module.exports = router;