/**
 * initialize usergrid and authenticate application.
 */

var apigee_baas_config = require('../config/properties').apigee_baas,
	Usergrid =  require('usergrid'); 

Usergrid.init({
    orgId: apigee_baas_config.organization,
    appId: apigee_baas_config.application,
    baseUrl : apigee_baas_config.uri
});

/**
 * Set Client Id and Client Secret for user grid
 */
Usergrid.setAppAuth(apigee_baas_config.client_id, apigee_baas_config.client_secret);

/**
 * Usergrid.appAuth is created automatically when this call is successful
 */
Usergrid.authenticateApp(function(error, usergridResponse, token) {
    if(error){
    	console.log("Authentication failed. Please verify client id and client secret.")
    }
});

module.exports = Usergrid;
