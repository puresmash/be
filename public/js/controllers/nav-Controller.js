angular.module('SwatAngular')
.factory('Configuration', function ($log) {
    var self = {};
    // universal setter
    self.set = function (prop, val) {
        try {
            self[prop] = val;
        } catch (err) {
            $log.error(err);
        }
        return self;
    };
    return self;
})
.controller('NavController', function (Configuration) {
    var controller = this;
    
    // render login form GUI
//    gapi.signin2.render('my-signin2', {
//        'scope': 'profile https://www.googleapis.com/auth/drive.readonly',
//        'width': 120,
//        'height': 36,
//        'longtitle': false,
//        'theme': 'dark',
//        'onsuccess': onSuccess,
//        'onfailure': onFailure
//    });


//    function onSuccess(googleUser) {
//        var profile = googleUser.getBasicProfile();
//        var id_token = googleUser.getAuthResponse().id_token;
//        var access_token = googleUser['Ka']['access_token'];
//
//        $.ajax('/storeToken', {
//            type: 'POST',
//            data: {
//                id_token: id_token
//            },
//            success: function () {
//                console.log(profile.getName() + ', log in success!');
//            }
//        });

//        Configuration
//          .set('access_token', access_token)
//          .set('id_token', id_token);

//        console.log('ID: ' + profile.getId());
//        console.log('Name: ' + profile.getName());
//        console.log('Image URL: ' + profile.getImageUrl());
//        console.log('Email: ' + profile.getEmail());
//
//        //
//        $('#my-signin2').hide();
//
//        // Add avatar image
//        $('<img class="avatar" src="' + profile.getImageUrl() + '"></img>').appendTo('span#avatar');
//
//        // Display user info
//        var signOutDiv = $('div#sign-out');
//        signOutDiv.find('span#email').text(profile.getEmail());
//        signOutDiv.show();
//    }
//    this.auth2;    
//    
//    this.start = function(){
//        gapi.load('auth2', function() {
//            controller.auth2 = gapi.auth2.init({
//              client_id: '981468015509-6n46c29co3unjouhobqdphnki0ev5077.apps.googleusercontent.com',
//              // Scopes to request in addition to 'profile' and 'email'
//              'scope': 'profile https://www.googleapis.com/auth/drive.readonly'
//            });
//          });
//    };
            
    this.signin = function(){
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.grantOfflineAccess({'redirect_uri': 'postmessage'}).then(signInCallback);
    };
            
    function signInCallback(authResult){
        googleUser = gapi.auth2.getAuthInstance().currentUser.get();
            
            var profile = googleUser.getBasicProfile();
            var id_token = googleUser.getAuthResponse().id_token;
            console.log(googleUser);
            var access_token = googleUser['wc']['access_token'];
            var email = profile.getEmail();
            var code = authResult['code'];
            
          if (code) {

            // Hide the sign-in button now that the user is authorized, for example:
            $('#signinButton').hide();
            // Add avatar image
            $('<img class="avatar" src="' + profile.getImageUrl() + '"></img>').appendTo('span#avatar');
            // Display user info
            var signOutDiv = $('div#sign-out');
            signOutDiv.find('span#email').text(profile.getEmail());
            signOutDiv.show();
            
            // Send the code to the server
            $.ajax('/storeToken', {
              type: 'POST',

              success: function(result) {
                console.log(result + ', log in success!');
              },
//              processData: false,
              data: {'id_token': id_token, 'code': code}
            });
          } else {
            // There was an error.
          }
    }

    this.signOut= function() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('User signed out.');
            $('#signinButton').show();

            $('div#sign-out').hide();
            $('span#avatar img').remove();
        });
    };

//    function onFailure(error) {
//        console.log(error);
//    };

//    function renderButton() {
//        gapi.signin2.render('my-signin2', {
//            'scope': 'profile https://www.googleapis.com/auth/drive.readonly',
//            'width': 120,
//            'height': 36,
//            'longtitle': false,
//            'theme': 'dark',
//            'onsuccess': onSuccess,
//            'onfailure': onFailure,
//        });
//    }

});