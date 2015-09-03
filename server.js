var express = require('express');
var app = express();

var request = require('request');

var fs = require('fs');
var q = require('q');
var lodash = require('lodash');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var credentials = require('./credentials.js')
var mysql = require('mysql');

var db;
if(process.env.NPM_CONFIG_PRODUCTION)
    db = mysql.createConnection(credentials.mysql.product.connectionString);
else
    db = mysql.createConnection(credentials.mysql.dev.connectionString);
db.connect();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(require('cookie-parser')());
app.use(require('express-session')({secret: 'olaolaola'}));

app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

//var blocks = [];
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
app.post('/storeToken', function(req, res){
    var token = req.body.id_token;
    var url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+token;
    request(url, function(err, response, body){
        if (!err && response.statusCode == 200) {
            
            
            
            var info = JSON.parse(body);
            var aud = info.aud;
            var iss = info.iss;
            var email = info.email;
            req.session.email = email;
            console.log(info);
            
            
            res.status(200).json({email: email});
            return;
        }
        res.status(401).json({'error': 'invalid token'});
    });
    
    
});

app.post('/getDrive', function(req, res){
    
    var param = req.body;
    
    var code = param.code;
    console.log('123'+code);
    var week = param.week;
    var user = param.user;
    
    var promise = authorize(''/*JSON.parse(content)*/, code, week, req, searchFile);

    q.all(promise).then(function(result){
        console.log('Already Handover : '+result);
        res.status(200).json(result);
    }, function(err){
        console.log(err);
        res.status(403).send(err);
    });
    
});

app.get('/getUsers', function(req, res){
    db.query("SELECT id, nickname, enroll, color, t_id FROM be.user WHERE t_id>0 ORDER BY t_id", function(err, result){
        if(err){
            console.log(err);
            return;
        }
        var users = [[],[],[],[],[],[],[]];
        console.log(users);
        result.forEach(function(user){
            
            var team = user.t_id;

            users[team].push(user);
            
        });
        res.status(200).json({users: users});
        
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

//app.get('/getMember', function(req, res){
//    db.query("SELECT user.id, user.nickname FROM be.user ORDER BY t_id;", [], function(err, result){
//        if(err){
//            console.log(err);
//            return;
//        }
//        console.log(result);
//        res.status(200).json({notes: result});  
//    });
//});

app.get('/getNote', function(req, res){
    var id = req.query.id || 0;
    console.log('ID='+id);
    db.query("SELECT * FROM be.message LEFT JOIN be.user ON message.u_id = user.id WHERE user.id = ?", [id], function(err, result){
        if(err){
            console.log(err);
            return;
        }
        
//        console.log(result);
        res.status(200).json({notes: result});
        
    });
//    res.status(200).json({notes: blocks});
});

app.post('/saveNote', function(req, res){
    var newBlock = req.body;
//    blocks.push({name: newBlock.name, description: newBlock.description});
//    console.log(blocks);
    db.query("INSERT INTO be.message(msg, u_id) VALUES(?, ?)", ['testjs', 0], function(err, result){
        if(err)
            console.log(err);
        else
            console.log(result);
    });
    
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

app.listen(app.get('port'), app.get('ip'), function(){
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
function authorize(credentials, code, week, req, callback) {
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
    
    if(req.session.tokens){
        console.log("FIND TOKEN IN SESSION: " + req.session.tokens);
        var access_token = req.session.tokens.access_token;
        var refresh_token = req.session.tokens.refresh_token;
        oauth2Client.setCredentials({ access_token: access_token, refresh_token: refresh_token });

        return result = callback(oauth2Client, week);
    }
    
    //
    var deferred = q.defer();
    var promise, promise2;
    
    var access_token, refresh_token;
//    if(req.session.email){
//        console.log('Ready To get Token Form DB');
//        promise = getTokenFormDB(req.session.email);
//        return promise.then(function(result){
//            access_token = result.aToken;
//            refresh_token = result.rToken;
//            
//            if(!access_token || !refresh_token){
//                console.log('Cannot got token from db, get a new one instead');
//                
//                promise2 = genToken(oauth2Client, code);
//                promise2.then(function(result){
//                    
//                    access_token = result.access_token;
//                    refresh_token = result.refresh_token;
//                    
//                    console.log('aT2'+access_token+'rT2'+refresh_token);
//                    
//                });
//                promise2.then(function(result){
//                    db.query("UPDATE be.user SET 'aToken'='?', 'rToken'='?' WHERE 'email'='?';", [access_token, refresh_token, email], function(err, result){
//                        if(err)
//                            console.log(err);
//                        else
//                            console.log("update db success");
//                    
//                    });
//                });
//                
//                
//                return promise2.then(function(results){
//                    console.log('aT:'+access_token+'rT:'+refresh_token);
//                    oauth2Client.setCredentials({ access_token: access_token, refresh_token: refresh_token });
//                    return callback(oauth2Client, week);
//                });
//            }
//            else{
//                oauth2Client.setCredentials({ access_token: access_token, refresh_token: refresh_token });
//                return callback(oauth2Client, week);
//            }
//            
//             
//        });
//        
//
//    }
    
    
    promise = genToken(oauth2Client, code);
    
    

    return promise.then(function(result){
        access_token = result.access_token;
        refresh_token = result.refresh_token;
        console.log("Cannot find tokens in session or db, gen one: " + access_token +", "+refresh_token);
        oauth2Client.setCredentials({ access_token: access_token, refresh_token: refresh_token });
        req.session.tokens = result;
        return callback(oauth2Client, week);
    });
    
//        oauth2Client.generateAuthUrl({
//            access_type: 'offline',
//            scope: SCOPES
//        });
//
//        var deferred = q.defer();
//        oauth2Client.getToken(code, function(err, tokens) {
//          if (err) {
//            console.log('Error while trying to retrieve access token', err);
//            deferred.reject(err);
//            return deferred.promise;
//          }
//          req.session.tokens = tokens;
//
//          oauth2Client.setCredentials(tokens);
//          var result = callback(oauth2Client, week);
//          deferred.resolve(result);
//
//        });
//        return deferred.promise;
    
    

}

function genToken(oauth2Client, code){
    console.log('Prepare to gen token');
    oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    
    var deferred = q.defer();
    
    oauth2Client.getToken(code, function(err, tokens) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        deferred.reject(err);
        return;
      }
      console.log(tokens);
      deferred.resolve(tokens);
      console.log('Gen token success');
    });
    
    return deferred.promise;
}

function getTokenFormDB(email){
    
    var deferred = q.defer();
    db.query("SELECT aToken, rToken FROM be.user WHERE email=?", [email], function(err, result){
        if(err){
            console.log(err);
            deferred.reject(err);
            return;
        }
            
        var aToken = result[0].aToken;
        var rToken = result[0].rToken;
        
        console.log('aToken = ' + aToken);
        console.log('rToken = ' + rToken);
        
//        if(aToken && rToken)
            deferred.resolve({aToken: aToken, rToken: rToken});
//        else
//            deferred.reject("Cannot find token in DB");
    });
    return deferred.promise;
}

function searchFile(auth, week){
    var template = [['WK 1','WK1', '第一週', '第一週行動表', '第1週'],
                    ['WK 2','WK2', '第二週', '第二週行動表', '第2週'],
                    ['WK 3','WK3', '第三週', '第三週行動表', '第3週'],
                    ['WK 4','WK4', '第四週', '第四週行動表', '第4週'],
                    ['WK 5','WK5', '第五週', '第五週行動表', '第5週'],
                    ['WK 6','WK6', '第六週', '第六週行動表', '第6週'],
                    ['WK 7','WK7', '第七週', '第七週行動表', '第7週']];
    
    // Retrieve Member From File
    var mPath = __dirname+'/properties/memberList.json';
    var jsonStr = fs.readFileSync(mPath);
    var member = JSON.parse(jsonStr);
    
//    var users={};
//    db.query("SELECT id, nickname, enroll, color, t_id FROM be.user WHERE t_id>0 ORDER BY t_id ", [], function(err, result){
//        if(err){
//            console.log(err);
//            return;
//        }
//            
//        result.forEach(function(user){
//            
//            var team = user.t_id;
//            console.log('team'+team);
//            if(!users[team]){
//                users[team] = {'mAry': [], 'folder': member[team].folder, 'leader': member[team].leader};
//            }
//            users[team].mAry.push({'id': user.id, 'nickname': user.nickname});
//            
//        });
//    });
    
    
    // Check For Each Team
    var result = [];
    for(var key in member){ 
        var team = member[key];
        result.push(searchName(auth, template[week-1], team.folder, team.mAry));
    }
    return result;
    
    
}

function searchName(auth, template, folderId, users){
    
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
            //console.log("Users = " + users);
            
            //new
            var handOver = {};
            users.forEach(function(user){
                var name = user.nickname;
                var id = user.id;
                for (var j = 0; j < teamFiles.length; j++) {
                    var file = teamFiles[j];
                    
                    var bool = lodash.includes(file.title.toLowerCase(), name.toLowerCase());
                    
                    if(bool){
                        console.log('%s (%s)', file.title.toLowerCase(), name.toLowerCase());
                        handOver[id] = true;
                        return;
//                        return {'name': name, 'id': id, 'handOver': true};
                    }
                }
                handOver[id] = false;
//                return {'name': name, 'id': id, 'handOver': false};
            });
            
            return handOver;

        });
    });
    
    
}

/**
 * Lists the users and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, query) {
  var service = google.drive('v2');
    
  query = "'" + query + "'" + " in parents";
  console.log(query);
    
  return q.nfcall(service.files.list, {auth: auth, maxResults:10, q: query});
}