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
    this.isSignIn = false;

    // Check if user idle for a while and press F5
    this.checkLogin = function(){

        $.ajax('checkLogin', {
            type: 'POST',
            data:{}
        })
        .done(function(result){
            console.log('is login: ');
            console.log(result);
            if(result && result.email && result.avatarUrl){
                updAvatar({email: result.email, avatarUrl: result.avatarUrl});
            }
        })
        .fail(function(jqXHR){
            var status = jqXHR.status;
            var msg = jqXHR.responseJSON;
            if(status == '401' && controller.isSignIn){
                controller.signOut();
            }
        });
    };
    this.checkLogin();

    this.refreshToken = function(){
        $.ajax('refreshToken', {
            type: 'POST',
            success: function(result){
                console.log('refreshToken result');
                console.log(result);
                resolve('refreshToken result');
            },
            error: function(jqXHR, status, err){
                console.log(err);
            },
            data: {}
        });
    };

    this.signin = function(){
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.grantOfflineAccess({'redirect_uri': 'postmessage'}).then(signInCallback);
    };

    function signInCallback(authResult){
        var googleUser = gapi.auth2.getAuthInstance().currentUser.get();
        console.log(googleUser);
        var profile = googleUser.getBasicProfile();
        var id_token = googleUser.getAuthResponse().id_token;

        var code = authResult['code'];
        if (code) {
            updAvatar({email: profile.getEmail(), avatarUrl: profile.getImageUrl()});

            // Send the code to the server
            $.ajax('/storeToken', {
                type: 'POST',

                success: function(result) {
                  console.log(result + ', log in success!');
                },
                // processData: false,
                data: {'id_token': id_token, 'code': code}
            });
        } else {
          // There was an error.
        }
    }

    function updAvatar(userProfile){
        // Hide the sign-in button now that the user is authorized, for example:
        $('#signinButton').hide();
        // Add avatar image
        $('<img class="avatar" src="' + userProfile.avatarUrl + '"></img>').appendTo('span#avatar');

        // Display user info
        var signOutDiv = $('div#sign-out');
        signOutDiv.find('span#email').text(userProfile.email);
        signOutDiv.show();
        controller.isSignIn = true;
    }

    this.signOut= function() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('User signed out.');
            $('div#sign-out').hide();
            $('span#avatar img').remove();

            $('#signinButton').show();
            controller.isSignIn = false;
        });
    };

    this.collapse = function($event){
        $('.collapse').collapse('toggle');
    }
});
