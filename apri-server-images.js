/*
** Module: apri-server-images
**
** System module for images service handling client requests for images like R graphs etc.
**
*/
// activate init process config-main
var path = require('path');
var startFolder 			= __dirname;
var startFolderParent		= path.resolve(__dirname,'..');
var configServerModulePath	= startFolderParent + '/apri-server-config/apri-server-config';
console.log("Start of Config Main ", configServerModulePath);
var apriConfig = require(configServerModulePath)

var systemFolder 			= __dirname;
var systemFolderParent		= path.resolve(__dirname,'..');
var systemFolderRoot		= path.resolve(systemFolderParent,'..');
var systemModuleFolderName 	= path.basename(systemFolder);
var systemModuleName 		= path.basename(__filename);
var systemBaseCode 			= path.basename(systemFolderParent);

//console.log('systemFolder', systemFolder);  				// systemFolder /opt/TSCAP-550/node-apri
//console.log('systemFolderParent', systemFolderParent);  	// systemFolderParent /opt/TSCAP-550
//console.log('systemFolderRoot', systemFolderRoot);  	// systemFolderRoot   /opt

var initResult = apriConfig.init(systemModuleFolderName+"/"+systemModuleName);

var apriClientSysName 	= 'apri-client-sys';
var apriClientName 		= '';  // defaults to apriClientSysName

// **********************************************************************************

// add module specific requires
//var request 			= require('request');
var express 			= require('express');

var bodyParser 			= require('body-parser');
var fs 					= require('fs');
//var xml2js 				= require('xml2js');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// **********************************************************************************



var imagesLocalPath = systemFolderParent +'/images/';
console.log (imagesLocalPath);

app.all('/*', function(req, res, next) {
  console.log("app.all/: " + req.url + " ; systemCode: " + apriConfig.systemCode );
//  res.header("Access-Control-Allow-Origin", "*");
//  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// test url for systemcode
app.get('/'+apriConfig.systemCode+'/', function(req, res) {
  console.log("Reqparam: " + req.url);
  res.send("ok");
});


// test url for systemcode
app.get('/'+apriConfig.systemCode+'/', function(req, res) {
  console.log("Reqparam: " + req.url);
  res.send("ok");
});


// handling of different filetypes in R folder
app.get('/'+apriConfig.systemCode+'/images/R/*.png', function(req, res) {
  //console.log("YUI request: " + req.url );
  try {
    var url = req.url.replace(/\.\./gi,'');
    var _jsFile=fs.readFileSync(systemFolderRoot + url);
    res.contentType('image/png');
    res.send(_jsFile);
  }
  catch(error) {
    //console.error(error);
    console.error('image not found: '+ systemFolderRoot+req.url);
    res.send('Image not found');
  }

});



var getLocalFile = function(req, res, options) {
	console.log("Apri /*.extension request: " + req.url );
	fs.readFile(systemFolderRoot + req.url, function(err, data){
		if (err) {
			console.log(err);
		}
		res.contentType(options.contentType);
		res.send(data);
	})
};



app.listen(apriConfig.systemListenPort);
console.log('listening to http://proxyintern: ' + apriConfig.systemListenPort);


function StreamBuffer(req) {
  var self = this

  var buffer = []
  var ended  = false
  var ondata = null
  var onend  = null

  self.ondata = function(f) {
    console.log("self.ondata")
    for(var i = 0; i < buffer.length; i++ ) {
      f(buffer[i])
      console.log(i);
    }
    console.log(f);
    ondata = f
  }

  self.onend = function(f) {
    onend = f
    if( ended ) {
      onend()
    }
  }

  req.on('data', function(chunk) {
    var _reqBody=JSON.parse(req.body);
    console.log("req.on data: " + _reqBody.name + "." + _reqBody.type);
    if (appTypes[_reqBody.type][_reqBody.appItemSequence]) {
      appTypes[_reqBody.type][_reqBody.appItemSequence] += chunk;
    } else {
      appTypes[_reqBody.type][_reqBody.appItemSequence] = chunk;
    }

    if( ondata ) {
      ondata(chunk)
    }
    else {
      buffer.push(chunk)
    }
  })

  req.on('end', function() {
    //console.log("req.on end")
    ended = true;
    nrTransactions--;
    var _reqBody=JSON.parse(req.body);
    console.log("req.on end: " + _reqBody.name + "." + _reqBody.type + " " + _reqBody.appItemSequence);
    writeFile(appsLocalPath, _reqBody.name + "." + _reqBody.type , appTypes[_reqBody.type][_reqBody.appItemSequence].toString());

    if( onend ) {
      onend()
    }
  })

  req.streambuffer = self
}
