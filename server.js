var express = require('express');
var app = express();

var request = require('request');

var fs = require('fs');
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
//    var token = req.query.code;
//    console.log('ToKen = ' + token);
    res.redirect(303, '/#/home/');//?token='+ token
});

var token;
app.post('/storeToken', function(req, res){
    var param = req.body;
    var id_token = param.id_token;
    var code = param.code;
    var url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + id_token;
    // According id_token, validating whether the incoming user is valid and get login info.
    request(url, function(err, response, body){
        if (!err && response.statusCode == 200) {
            var info = JSON.parse(body);
            var aud = info.aud;
            var iss = info.iss;
            var email = info.email;
            var avatarUrl = info.picture;
            req.session.email = email;
            req.session.avatarUrl = avatarUrl;
            console.log(info);

            // Could validate aud and iss here, then use the response email for login.
            console.log("===After Login Start===");
            afterLogin(email, code, req).then(function(result){
                res.status(200).json({email: email});

            });
            return;
        }
        res.status(401).json({'error': 'invalid token'});
    });
});

app.post('/checkLogin', function(req, res){
    var session = req.session;

    if(session.email)
        res.status(200).json({email: session.email, avatarUrl: session.avatarUrl});
    else {
        res.status(401).json({'error': 'must login first'});
    }
});

app.post('/refreshToken', function(req, res){
    var email = req.session.email;
    if(!email){
      console.log('Non-login before.');
      return;
    }

    var oauth2Client = getCredentialsFromSession(req);

    new refreshToken(req).then(()=>{

        console.log('refresh token succeed');
        res.status(200).json({success: true});
    })
    .catch((err)=>{
        console.log('refresh token failed');
        res.status(403).json({success: false, msg: err});
    });
});

app.post('/getDrive', function(req, res){

    var param = req.body;
    var week = param.week;
    var email = req.session.email;
    // TODO handle tokens not set error (just send err msg to user)
    var promiseAry = authorize(req, week, searchForEachTeam);
    console.log(promiseAry);
    // should alreay set tokens in session, otherwise throw err
    Promise.all(promiseAry).then(function(result){
        console.log('Already Handover : '+result);
        res.status(200).json(result);
        return;
    })
    .catch(function(err){
        console.log(err);
        if(err.code == 401){
            console.log('manully update token with ' + email);
            return refreshToken(req);
        }
        res.status(403).send(err);
    })
    .then(()=>{
        console('@@@@@@@@@@@@@@@');
    });

});

app.get('/getUsers', function(req, res){
    db.query("SELECT id, nickname, t_id FROM demo.user WHERE t_id>0 ORDER BY t_id", function(err, result){
        if(err){
            console.log(err);
            return;
        }
        // There are 7 teams at most
        var users = [[],[],[],[],[],[],[]];
        result.forEach(function(user){
            var team = user.t_id;
            users[team].push(user);
        });
        res.status(200).json({users: users});
    });
});

app.get('/getNews', function(req, res){
    res.status(200)
        .json({news: 'Hello WebService with NodeJS & mvc with AngularJS'});
});

app.use(function(req, res){
	res.status(404).send('Sorry cant find that!');;
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500).send('Something failed!');
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
 * Using one times code to purchase access_token, refresh_token from google
 * then store it to both db and session.
 * If user did purchase tokens before, get them from db instead, then prepare them
 * in session for later usage.
 *
 * @param {email} as a key to distinguish user identity.
 * @param {code} one times code publishing by google.
 * @param {req} saving tokens to session at last.
 */
function afterLogin(email, code, req) {
    console.log('User use google sign in');
    var oauth2Client = createOAuth2Client();

    //S2
    if (email) {
        console.log('Ready To get Token Form DB');
        return getTokenFormDB(email)
        .then(function (result) {
            var access_token = result.aToken;
            var refresh_token = result.rToken;
            return setCredentialsToSession(access_token, refresh_token, req);
        })
        .catch(function (err) {
            console.log('Cannot got token from db, get a new one instead');
            console.log('===== getTokenFormDB end =====');
            // generate token
            return genToken(oauth2Client, code)
                .then(function (result) {
                    var access_token = result.access_token;
                    var refresh_token = result.refresh_token;
                    return setCredentialsToSession(access_token, refresh_token, req);
                }).then(function (credentials) {
                    console.log('updateTokenToDB');
                    updateTokenToDB(credentials.access_token, credentials.refresh_token, email);
                });
        })
        .catch(function(err){
            console.log('REDIRECT_URL: '+ REDIRECT_URL);
            console.log('CODE: '+ code);
            console.log('login failed(' + email + ')');
        })
        .then(function(){
            console.log("===After Login End===");
        });
    }
}

function createOAuth2Client(){
    if(!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URL)
        configAuth();
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    return oauth2Client;
}

function setCredentialsToSession(access_token, refresh_token, req){
    console.log('setCredentialsToSession: ');
    console.log('access_token: ', access_token);
    console.log('refresh_token: ', refresh_token);
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    return {access_token, refresh_token};
}

function getCredentialsFromSession(req){
    if(!req.session.access_token || !req.session.refresh_token){
        console.log(req.session.access_token);
        console.log(req.session.refresh_token);
        throw new Error("There aren't any token prepared in session, pls login first");
    }

    var oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
          access_token: req.session.access_token,
          refresh_token: req.session.refresh_token
    });
    console.log('Setting credentials to oauth2Client with: ');
    console.log(oauth2Client.credentials);
    return oauth2Client;
}

function refreshToken(req){
    var email = req.session.email;
    var oauth2Client = getCredentialsFromSession(req);

    return new Promise((resolve, reject)=>{

        oauth2Client.refreshAccessToken(function(err, tokens) {
            if(err || !tokens){
                reject(err);
                return;
            }

            var access_token = tokens.access_token;
            var refresh_token = tokens.refresh_token;
            console.log(`at: ${access_token}, rt: ${refresh_token}`);
            setCredentialsToSession(access_token, refresh_token, req);
            updateTokenToDB(access_token, refresh_token, email);

            resolve(tokens);
        });
    });
}

function getTokenFormDB(email){
    console.log('===== getTokenFormDB start =====');
    return new Promise((resolve, reject)=>{
        db.query("SELECT aToken, rToken FROM demo.user WHERE email=?", [email], function(err, result){
            if(err){
                console.log(err);
                reject(err);
                console.log('===== getTokenFormDB end =====');
                return;
            }

            var aToken = result[0].aToken;
            var rToken = result[0].rToken;
            console.log(`aToken = ${aToken}, rToken = ${rToken}`);

            if(!aToken || !rToken){
                var msg = 'Cannot find token in DB for this user';
                console.log(msg);
                reject(msg);
                console.log('===== getTokenFormDB end =====');
                return;
            }
            resolve({aToken: aToken, rToken: rToken});
            console.log('===== getTokenFormDB end =====');
        });
    });
}

function genToken(oauth2Client, code){
    console.log('===== Gen token start =====');
    var url = oauth2Client.generateAuthUrl({
        //access_type: 'offline',
        scope: SCOPES
        //approval_prompt: "force"
    });

    console.log('calling url: ', url);

    return new Promise(function(resolve, reject) {
        oauth2Client.getToken(code, function(err, tokens) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            console.log(oauth2Client);
            reject(err)
          }
          else{
            console.log(tokens);
            console.log('Gen token success');
            resolve(tokens);
          }
          console.log('===== Gen token end =====');
        });
    })
}

/**
 * Save current token to db async
 * (when there is no need to assure execute order)
 * @param {string} access_token access_token
 * @param {string} refresh_token refresh_token
 * @param {string} email email will be used as a key in DB
 */
function updateTokenToDB(access_token, refresh_token, email){
    console.log('===== Upd token start =====');
    var qs = "UPDATE demo.user SET aToken=?, rToken=? WHERE email=?;";
    var qAry = [access_token, refresh_token, email];
    if(!refresh_token){
        qs = "UPDATE demo.user SET aToken=? WHERE email=?;";
        qAry = [access_token, email];
    }
    db.query(qs, qAry, function (err, result) {
        if (err)
            console.log(err);
        else
            console.log("update db success");
    });
    console.log('===== Upd token end =====');
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(req, week, callback) {
    //retrieve credentials from session
    var oauth2Client = getCredentialsFromSession(req);

    if(oauth2Client){
        return callback(oauth2Client, week);
    }
}

function searchForEachTeam(auth, week){
    var template = [['week1','WK1', '第一週', '第1週'],
                    ['week2','WK2', '第二週', '第2週']];

    // Retrieve Member From File
    var mPath = __dirname+'/properties/memberList.json';
    var jsonStr = fs.readFileSync(mPath);
    var member = JSON.parse(jsonStr);

    // Check For Each Team
    var result = [];
    for(var key in member){
        var team = member[key];
        console.log(team);
        console.log(auth);
        console.log(template);
        result.push(searchNames(auth, template[week-1], team.folder, team.mAry));
    }
    console.log('result');
    console.log(result);
    return result;
}

function searchNames(auth, template, folderId, users){
    return listFiles(auth, folderId)
        .then(function(res){
            if(res[0])
                res = res[0];
            var teamFiles = res.items;
            var file = teamFiles.find(function(file){
                return (file.title === template[0] || file.title === template[1] ||
                    file.title === template[2] || file.title === template[3] );
            });
            if(!file || !file.id){
                throw new Error('Cannot find corresponding folder at google driver');
            }
            return file.id;
        })
        .then(function(folderId){
            return listFiles(auth, folderId);
        })
        .then(function(res){
            if(res[0])
                res = res[0];
            var teamFiles = res.items;
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
                    }
                }
                handOver[id] = false;
            });
            return handOver;
        })
        .catch(function(err){
            console.log('Fail retrieve files cause by ');
            console.log(err);
            console.log(err.stack);
            throw err;
        });

}

/**
 * Lists the users and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, query) {
  var service = google.drive('v2');
  query = `'${query}' in parents and trashed = false`;
  console.log('Execute query: ' + query);

  return new Promise((resolve, reject)=>{
          service.files.list({
              auth: auth,
              maxResults:10,
              q: query
          }, function(err, response){
              if(err){
                  console.log('Calling google service failed');
                  console.log(err);
                  reject(err);
              }
              resolve(response);
          })
  });

}

// old version using q
// function listFiles(auth, query) {
//   var service = google.drive('v2');
//
//   query = `'${query}' in parents and trashed = false`;
//   console.log('Execute query: ' + query);
//   return q.nfcall(service.files.list, {auth: auth, maxResults:10, q: query});
// }
