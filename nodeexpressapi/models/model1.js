const mongoose = require('mongoose');
//Muss an Datenerfordernisse angepasst werden

const DataScheme = mongoose.Schema({
	titel:{
		type: String, required: true
		},

	date:{
		type: Date, default: Date.now
		}
	});


module.exports = mongoose.model('Data', DataScheme);