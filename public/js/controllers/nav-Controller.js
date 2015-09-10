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

    // render login form GUI
    gapi.signin2.render('my-signin2', {
        'scope': 'profile https://www.googleapis.com/auth/drive.readonly',
        'width': 120,
        'height': 36,
        'longtitle': false,
        'theme': 'dark',
        'onsuccess': onSuccess,
        'onfailure': onFailure
    });


    function onSuccess(googleUser) {
        var profile = googleUser.getBasicProfile();
        var id_token = googleUser.getAuthResponse().id_token;
        var access_token = googleUser['Ka']['access_token'];

        $.ajax('/storeToken', {
            type: 'POST',
            data: {
                id_token: id_token
            },
            success: function () {
                console.log(profile.getName() + ', log in success!');
            }
        });

        Configuration
          .set('access_token', access_token)
          .set('id_token', id_token);

        console.log('ID: ' + profile.getId());
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail());

        //
        $('#my-signin2').hide();

        // Add avatar image
        $('<img class="avatar" src="' + profile.getImageUrl() + '"></img>').appendTo('span#avatar');

        // Display user info
        var signOutDiv = $('div#sign-out');
        signOutDiv.find('span#email').text(profile.getEmail());
        signOutDiv.show();
    }

    function signOut() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('User signed out.');
            $('#my-signin2').show();

            $('div#sign-out').hide();
            $('span#avatar img').remove();
        });
    }

    function onFailure(error) {
        console.log(error);
    }

    function renderButton() {
        gapi.signin2.render('my-signin2', {
            'scope': 'profile https://www.googleapis.com/auth/drive.readonly',
            'width': 120,
            'height': 36,
            'longtitle': false,
            'theme': 'dark',
            'onsuccess': onSuccess,
            'onfailure': onFailure
        });
    }

});