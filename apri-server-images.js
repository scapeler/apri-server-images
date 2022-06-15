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
logger.info("Start of Config Main ", configServerModulePath);
var apriConfig = require(configServerModulePath)

var systemFolder 			= __dirname;
var systemFolderParent		= path.resolve(__dirname,'..');
var systemFolderRoot		= path.resolve(systemFolderParent,'..');
var systemModuleFolderName 	= path.basename(systemFolder);
var systemModuleName 		= path.basename(__filename);
var systemBaseCode 			= path.basename(systemFolderParent);

//logger.info('systemFolder', systemFolder);  				// systemFolder /opt/TSCAP-550/node-apri
//logger.info('systemFolderParent', systemFolderParent);  	// systemFolderParent /opt/TSCAP-550
//logger.info('systemFolderRoot', systemFolderRoot);  	// systemFolderRoot   /opt

var initResult = apriConfig.init(systemModuleFolderName+"/"+systemModuleName);

var apriClientSysName 	= 'apri-client-sys';
var apriClientName 		= '';  // defaults to apriClientSysName

// **********************************************************************************

var logConfiguration = {}
var winston
var logger={
  info:function(logmsg) {
    console.log(logmsg)
  }
}
try {
  winston = require('winston')
  require('winston-daily-rotate-file')
}
catch (err) {
  logger.info('winston module (log) not found');
}

try {
  logConfiguration = {
    'transports': [
//          new winston.transports.Console()
      new winston.transports.DailyRotateFile({
          filename: 'aprisensor-raspi-%DATE%.log',
          dirname: '/var/log/aprisensor',
          datePattern: 'YYYY-MM-DD'//,
//          maxSize: '20m',
//          maxFiles: '1d'
        })
/*      new winston.transports.File({
            //level: 'error',
            // Create the log directory if it does not exist
            filename: '/var/log/aprisensor/aprisensor.log'
      })
*/
    ]
  };
  logger = winston.createLogger(logConfiguration);
}
catch (err) {
  logger.info('winston.createLogger error');
}
logger.info("Start of Config Main " + configServerModulePath);

// add module specific requires
var express 			= require('express');

//var bodyParser 			= require('body-parser');
var fs 					= require('fs');

var app = express();

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));

// **********************************************************************************

var imagesLocalPath = systemFolderParent +'/images/';
logger.info(imagesLocalPath);

app.all('/*', function(req, res, next) {
  logger.info("app.all/: " + req.url + " ; systemCode: " + apriConfig.systemCode );
  next();
});

// test url for systemcode
app.get('/'+apriConfig.systemCode+'/', function(req, res) {
  logger.info("Reqparam: " + req.url);
  res.send("ok");
});
// test url for systemcode
app.get('/'+apriConfig.systemCode+'/', function(req, res) {
  logger.info("Reqparam: " + req.url);
  res.send("ok");
});

// handling of different filetypes in R folder
app.get('/'+apriConfig.systemCode+'/images/R/*.png', function(req, res) {
  try {
    var url = req.url.replace(/\.\./gi,'');
    var _jsFile=fs.readFileSync(systemFolderRoot + url);
    res.contentType('image/png');
    res.send(_jsFile);
  }
  catch(error) {
    logger.error('image not found: '+ systemFolderRoot+req.url);
    res.send('Image not found');
  }

});

// handling of different filetypes in graphviz folder
app.get('/'+apriConfig.systemCode+'/images/graphviz/*.png', function(req, res) {
  try {
    var url = req.url.replace(/\.\./gi,'');
    var _jsFile=fs.readFileSync(systemFolderRoot + url);
    res.contentType('image/png');
    res.send(_jsFile);
  }
  catch(error) {
    logger.error('image not found: '+ systemFolderRoot+req.url);
    res.send('Image not found');
  }
});

app.get('/'+apriConfig.systemCode+'/images/apri-sensor/*.img', function(req, res) {
  try {
    var url = req.url.replace(/\.\./gi,'');
    var _jsFile=fs.readFileSync(systemFolderRoot + url);
    res.contentType('application/octet-stream');
    res.send(_jsFile);
  }
  catch(error) {
    logger.error('image not found: '+ systemFolderRoot+req.url);
    res.send('Image not found');
  }
});

// handling of different filetypes in R folder
app.get('/'+apriConfig.systemCode+'/images/logo/*.ai', function(req, res) {
  try {
    var url = req.url.replace(/\.\./gi,'');
    var _jsFile=fs.readFileSync(systemFolderRoot + url);
    res.contentType('image/ai');
    res.send(_jsFile);
  }
  catch(error) {
    logger.error('image not found: '+ systemFolderRoot+req.url);
    res.send('Image not found');
  }

});

var getLocalFile = function(req, res, options) {
	logger.info("Apri /*.extension request: " + req.url );
	fs.readFile(systemFolderRoot + req.url, function(err, data){
		if (err) {
			logger.error(err);
		}
		res.contentType(options.contentType);
		res.send(data);
	})
};



app.listen(apriConfig.systemListenPort);
logger.info('listening to http://proxyintern: ' + apriConfig.systemListenPort);


function StreamBuffer(req) {
  var self = this

  var buffer = []
  var ended  = false
  var ondata = null
  var onend  = null

  self.ondata = function(f) {
    //logger.info("self.ondata")
    for(var i = 0; i < buffer.length; i++ ) {
      f(buffer[i])
  //    logger.info(i);
    }
  //  logger.info(f);
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
    logger.info("req.on data: " + _reqBody.name + "." + _reqBody.type);
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
    //logger.info("req.on end")
    ended = true;
    nrTransactions--;
    var _reqBody=JSON.parse(req.body);
    logger.info("req.on end: " + _reqBody.name + "." + _reqBody.type + " " + _reqBody.appItemSequence);
    writeFile(appsLocalPath, _reqBody.name + "." + _reqBody.type , appTypes[_reqBody.type][_reqBody.appItemSequence].toString());

    if( onend ) {
      onend()
    }
  })

  req.streambuffer = self
}
