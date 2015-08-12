var express = require('express');
var app = express();

var request = require('request');

var fs = require('fs');
var q = require('q');
var lodash = require('lodash');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

var blocks = [];
//app.get('/', function(req, res){
//    res.status(200).json('Hello World');
//});

/**
 * Redirect Target Form Google OAuth
 */
app.get('/home', function(req, res){
    var token = req.query.code;
    console.log('ToKen = ' + token);
    res.redirect(303, '/#/home/?token='+ token);
});

var token;
app.get('/getDrive', function(req, res){
    var code = req.query.token;
    var week = req.query.week;
    var promise = authorize(''/*JSON.parse(content)*/, code, week, searchFile);

    q.all(promise).then(function(result){
        console.log('Already Handover : '+result);
        res.status(200).json(result);
    });
    
   
    
    
    
});

app.get('/getPlaces', function(req, res){

    var url = "https://graph.facebook.com/me/tagged_places";
    url += '?access_token='+req.query.access_token;
    
    request(url, function(err, response, body){
        var places = [];
        
        JSON.parse(body).data.forEach(function(data){
            var place = {}
            place.name = data.name;
            place.time = data.created_time;
            place.city = data.place.location.city;
            place.street = data.place.location.street;
            place.latitude = data.place.location.latitude;
            place.longitude = data.place.location.longitude;
            places.push(place);
        });
        res.status(200).json({'places': places});
    });
    
});

app.get('/getNews', function(req, res){
    res.status(200)
        .json({news: 'Hello WebService with NodeJS & mvc with AngularJS'});
});

app.get('/getNote', function(req, res){
    res.status(200).json({notes: blocks});
});

app.post('/saveData', function(req, res){
    var newBlock = req.body;
    blocks.push({name: newBlock.name, description: newBlock.description});
    console.log(blocks);
    res.status(201).json(newBlock.name);
});

app.use(function(req, res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + 
		app.get('port') + '; press Ctrl-C to terminate...');
});




var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/nodeJs/SocialLinker/credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gDriveViewer.json';

var CLIENT_SECRET;
var CLIENT_ID;
var REDIRECT_URL;

function configAuth(){
    var cPath = __dirname+'/credentials/client_secret.json';
    var jsonStr = fs.readFileSync(cPath);
    var setting = JSON.parse(jsonStr).web;
    CLIENT_ID = setting.client_id;
    CLIENT_SECRET = setting.client_secret;
    REDIRECT_URL = setting.redirect_uris[0];
    
}

//authorize(''/*JSON.parse(content)*/, searchFile);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, code, week, callback) {
//  var clientSecret = "hHVw25vkxDY3dKfa4U1gKQcA";
    //credentials.installed.client_secret;
//  var clientId = "981468015509-6n46c29co3unjouhobqdphnki0ev5077.apps.googleusercontent.com";
  //credentials.installed.client_id;
//  var redirectUrl = "http://localhost:3000/home/";
    //credentials.installed.redirect_uris[0];
    if(!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URL)
        configAuth();
    
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    
    console.log('@CoDe@'+code);
    
    oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    //getNewToken(oauth2Client, callback);
    var deferred = q.defer();
    oauth2Client.getToken(code, function(err, tokens) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        deferred.reject();
        return;
      }
      oauth2Client.credentials = tokens;
      //storeToken(token);
      console.log('I am here');
      var result = callback(oauth2Client, week);
      deferred.resolve(result);
        
    });
    return deferred.promise;

//    oauth2Client.credentials = code;
//    callback(oauth2Client);
  
  // Check if we have previously stored a token.
//  fs.readFile(TOKEN_PATH, function(err, token) {
//    if (err) {
//      getNewToken(oauth2Client, callback);
//    } else {
//      oauth2Client.credentials = JSON.parse(token);
//      callback(oauth2Client);
//    }
//  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
      console.log('code123123123= '+code);
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function searchFile(auth, week){
    var template = [['WK 1','WK1', '第一週', '第一週行動表', '第1週'],
                    ['WK 2','WK2', '第二週', '第二週行動表', '第2週'],
                    ['WK 3','WK3', '第三週', '第三週行動表', '第3週'],
                    ['WK 4','WK4', '第四週', '第四週行動表', '第4週'] ];
    
    // Retrieve Member From File
    var mPath = __dirname+'/properties/memberList.json';
    var jsonStr = fs.readFileSync(mPath);
    var member = JSON.parse(jsonStr);
    
//    console.log(mPath);
//    console.log(member);
    
    
    // Check For Each Team
    var result = [];
    for(var key in member){ 
        var team = member[key];
        result.push(searchName(auth, template[week-1], team.folder, team.mAry));
    }
    return result;
    
    
}

function searchName(auth, template, folderId, names){
    
    
    var promise = listFiles(auth, folderId);
    return promise.then(function(response){
        var teamFiles = response[0].items;
//        console.log('ReSuLt:'+teamFiles);
//        console.log(typeof teamFiles);
        //console.log(teamFiles);
        var folderId;
        teamFiles.forEach(function(file){
//            console.log('%s (%s)', file.title, file.id);
            if(file.title === template[0] || file.title === template[1] || file.title === template[2] 
               || file.title === template[3] || file.title === template[4]){
                folderId = file.id;
            }
//                else
//                    return;
        });
//        console.log("FolderId: "+folderId);
        if(!folderId){
            return;
        }
        var promise = listFiles(auth, folderId);
        return promise.then(function(response){
            var teamFiles = response[0].items;
            //console.log("NAmes = " + names);
            
            //new
            var handOver = names.map(function(name){
                for (var j = 0; j < teamFiles.length; j++) {
                    var file = teamFiles[j];
                    var bool = lodash.includes(file.title.toLowerCase(), name.toLowerCase());
                    
                    if(bool){
                        console.log('%s (%s)', file.title.toLowerCase(), name.toLowerCase());
                        return {'name': name, 'handOver': true};
                    }
                }
                return {'name': name, 'handOver': false};
            });
            
            //backup 
//            var handOver = teamFiles.map(function(file){
//                
//                for (var j = 0; j < names.length; j++) {
//                    var bool = lodash.includes(file.title.toLowerCase(), names[j].toLowerCase());
//                    
//                    
//                    if(!bool)
//                        continue;
//                    
//                    console.log('%s (%s)', file.title.toLowerCase(), names[j].toLowerCase());
//                
//                    return names[j];
//    //                names.splice(index, 1);
//                }
//            });
            return handOver;

        });
    });
    
    
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, query) {
  var service = google.drive('v2');
    
  query = "'" + query + "'" + " in parents";
  console.log(query);
    
  return q.nfcall(service.files.list, {auth: auth, maxResults:10, q: query});
}