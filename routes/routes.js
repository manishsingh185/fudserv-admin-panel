var express = require('express');
var router = express.Router();
var Usergrid = require('../config/usergrid');
var express = require('express');
var async = require('async');
var apigee_bass_config = require('../config/properties').apigee_baas;
var UsergridEntity = require('../node_modules/usergrid/lib/entity');
var UsergridQuery = require('../node_modules/usergrid/lib/query');100
var path = require('path');
var fudserv_admin_panel = require('../config/properties').fudserv_admin_panel;

var weekdays =  ['Sunday' , 'Monday' , 'Tuesday' , 'Wednesday' , 'Thursday' , 'Friday' , 'Saturday'];

router.get('/menus', function(req, res, next) {
	res.render('index');
});

router.get('/', function(req, res, next) {
	if(req.session && req.session.authenticated){
		res.redirect('/menus');
	}else{
		res.render('login');
	}
});

router.post('/sign-in', function(req, res, next) {
	if (req.body.username && req.body.username === fudserv_admin_panel.username && req.body.password && req.body.password === fudserv_admin_panel.password) {
			req.session.authenticated = true;
			res.redirect('/menus');
		} else {
			res.render('login', { errorflag: true});
}
});

router.get('/logout', function (req, res, next) {
		delete req.session.authenticated;
		res.redirect('/');
});

router.get('/reviews', function(req, res, next) {
	var cursor  = req.query.cursor;
	var query = new UsergridQuery('fudserv-food-menu-reviews')
				.limit(100);
	if(cursor){
		query = new UsergridQuery('fudserv-food-menu-reviews')
				.limit(100)
				.and
				.cursor(cursor);
	} 
	Usergrid.usingAuth(Usergrid.appAuth).GET(query, function(error, usergridResponse, entities) {
		if(error){
			console.log(error);
		}		
		res.render('reviews', { data: JSON.stringify(usergridResponse)});
	});
});

router.get('/aprrovereviews/:uuid', function(req, res, next) {
	var uuid  = req.params.uuid;
	var query = new UsergridQuery('fudserv-food-menu-reviews')
                             .eq('uuid', uuid);

	Usergrid.usingAuth(Usergrid.appAuth).PUT(query, { is_review_approved : true }, function(error, usergridResponse) {
		if(error){
			console.log("error : "  + error);
		}
		res.json(usergridResponse);
	});
});

/**router.get('/fudserv-food-menus' , function(req, res, next) {
	Usergrid.usingAuth(Usergrid.appAuth).GET('fudserv-food-menu-reviews', function(error, usergridResponse, entities) {
		if(error){
			console.log(error);
		}		
		res.json(usergridResponse);
	});	
});
**/

router.post('/fudserv-food-menus' , function(req, res, next) {
	
	var weekdate = req.body.week_start_date.split("-");
	var week_start_date =  new Date(weekdate[2], weekdate[1] - 1, weekdate[0]);
	var week_end_date = new Date(weekdate[2], weekdate[1] - 1, weekdate[0]);
	week_end_date.setDate(week_end_date.getDate()+ 6);
		
	var entities =  [];
	
	for(var i = 0 ; i < 7 ; i++){		
		var date = new Date(week_start_date);
		date.setDate(date.getDate()+ i);
		
		entities.push(new UsergridEntity({
				type: 'fudserv-food-menus',
				menu_date: convertDatetoString(date),
				menu_day: getWeekDayFromDate(date),
		        menu_items: req.body[getWeekDayFromDate(date)+'_menu_items'],
		        menu_other_details: req.body[getWeekDayFromDate(date)+'_menu_other_details'],
		        menu_type: req.body.menu_type,
		        week_end_date: convertDatetoString(week_end_date),
		        week_start_date: convertDatetoString(week_start_date)
		    })
		);
	}
	
	//user grid POST array only able to insert a single entry
	/*Usergrid.usingAuth(Usergrid.appAuth).POST(entities, function(error, usergridResponse, entities) {
		if(error){
			console.log(error);
		}
		
		res.json(usergridResponse);
	});*/
	
	async.eachSeries(entities, function(entity, done) {
  		Usergrid.usingAuth(Usergrid.appAuth).POST(entity, function(error, usergridResponse, entity) {
		if(error){
			console.log("error : "  + error);
		}
		done();
		});
	}, function(err) {
		var responsestring = "data uploaded successfully."
  		if (err){
			  console.log(err);
			  responsestring = "Something went wrong with insert. please check console logs.";
		  };
  		res.json({"status" : responsestring});
	});
	
	//res.json({"status" : "data uploaded successfully."});
});

router.get('/search-food-menus' , function(req, res, next) {
	var weekstartdate =  new Date();
	weekstartdate.setDate(weekstartdate.getDate() - (weekstartdate.getDay() - 1));

	var weekenddate =  new Date();
	weekenddate.setDate(weekstartdate.getDate() + 6);

	var query = new UsergridQuery('fudserv-food-menus')
    .eq('menu_type', req.query.menu_type)
	.and
	.eq('week_start_date' , convertDatetoString(weekstartdate))
	.and
	.eq('week_end_date' , convertDatetoString(weekenddate));

	Usergrid.usingAuth(Usergrid.appAuth).GET(query, function(error, usergridResponse) {
		if(error){
			console.log(error);
		}
		console.log(usergridResponse);		
		res.json(usergridResponse);
	});	
});

/**router.get('/fudserv-food-menu-reviews' , function(req, res, next) {
	Usergrid.usingAuth(Usergrid.appAuth).GET('fudserv-food-menu-reviews', function(error, usergridResponse, entities) {
		if(error){
			console.log(error);
		}
		
		res.json(usergridResponse);
	});	
});

router.post('/fudserv-food-menu-reviews' , function(req, res, next) {
	Usergrid.usingAuth(Usergrid.appAuth).POST(req.body, function(error, usergridResponse, body) {
		if(error){
			console.log("error : "  + error);
		}

		res.json(usergridResponse);
	});
});
**/

var insertInArray = function(entity){
	Usergrid.usingAuth(Usergrid.appAuth).POST(entity, function(error, usergridResponse, entity) {
		if(error){
			console.log("error : "  + error);
		}
	});
};

var convertDatetoString  =  function(date){
	var dd = date.getDate();
	var mm = date.getMonth()+1;

	var yyyy = date.getFullYear();
	if(dd<10){
	    dd='0'+dd;
	} 
	if(mm<10){
	    mm='0'+mm;
	} 
	return dd+'-'+mm+'-'+yyyy;
}

var getWeekDayFromDate =  function(date){
	var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	return days[date.getDay()];
}

module.exports = router;
