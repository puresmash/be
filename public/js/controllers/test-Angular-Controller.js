var app = angular.module('SwatAngular');

(function(){
  // IIFE, avoid naming pollution.
	//why this duplicate, there are also an angular.modlue() downward
  app.service('GmapService', ['$http', GmapService])

  function GmapService($http) {

      var service = this;

      var places;
      this.setPlaces = function(places){
          this.places = places;
      };

      this.getPlaces = function(FB){
          this.getPlacesFromFb(FB);
          return places;
      };

      this.getPlacesFromFb = function(FB){
          FB.getLoginStatus(function(response) {
              if (response.status === 'connected') {
              // the user is logged in and has authenticated your app,
              // and response.authResponse supplies
              // the user's ID, a valid access token, a signed request, 
              // and the time the access token and signed request each expire

                  var accessToken = response.authResponse.accessToken;

                  //localStorage.setItem('accessToken', accessToken);
                  console.log(accessToken);
                  //check user, in order to get user info
                  //checkUser();

                  var at = '?access_token='+accessToken;
                  $http({url: '/getPlaces'+at, method: 'GET'}).success(
                      function(getData){
                          service.setPlaces(getData.places);
                      }
                  );

              }
              else if (response.status === 'not_authorized') {
                  // the user is logged in to Facebook, 
                              //but has not authenticated the app
              }
              else {
                  //response.status === 'unknown'
                  // the user isn't logged in to Facebook.
              }
          });

      };


      var map;
      this.initMap = function(){

          var p = this.places[0];
          console.log(p);

          var center;
          if(p)
              center = { lat: p.latitude, lng: p.longitude};
          else
              center = { lat: -34.397, lng: 150.644}

          var mapOptions = {
            center: center,
            zoom: 12
          };
          var mapDiv = document.getElementById('map-canvas');

          map = new google.maps.Map(mapDiv, mapOptions);

          //google.maps.event.addDomListener(window, 'load', initialize);
      };



      //Markers
      var markers = [];

      this.getMarkers = function(){
          return markers;  
      };

      this.setMarker = function(place){

          var location = { lat: place.latitude, lng: place.longitude };

          map.setCenter(location);

          var marker = markers[location.lat] ||
              new google.maps.Marker({
                  position: location,
                  animation: google.maps.Animation.DROP,
                  map: map
          });

          this.markers[location.lat] = marker;
          codeLatLng(marker, place);
      };



      // 將經緯度座標反轉為路名
      var geocoder = new google.maps.Geocoder();
      var infowindow = new google.maps.InfoWindow();

      var codeLatLng = function(marker, place) {

          var latlng = marker.getPosition();
          var map  = marker.getMap();

          $apply(geocoder.geocode({'location': latlng}, function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                  console.log(results);
                  if (results[0]) {
                      var street = results[0].formatted_address;
                      map.setZoom(12);
                      infowindow.setContent(street);
                      infowindow.open(map, marker);
                      console.log(street);
                      if(place)
                          place.street = street;
                  } else {
                      window.alert('No results found');
                  }
              } else {
                  window.alert('Geocoder failed due to: ' + status);
              }
          }) );

      }
  }
}());

//GmapService.$inject = ['$http'];

app.controller('NoteController', function($http, GmapService){
    var controller = this;
    
    $http({url:'/getNote', method:'GET'}).success(function(getData){
        controller.notes = getData.notes;
        console.log(controller.notes);
    });
    
    console.log("11111111"+controller.FB);
    
    this.saveNote = function(note){
        console.log(note);
        $http({url: '/saveData', method:'POST', data: note})
        .catch(function(note){
            controller.errors = note.data.error;
        });  
    };
    
    this.getPlaces = function(){
        console.log("11111111"+controller.FB);
        return GmapService.getPlaces(controller.FB);
    }
    
    this.setMarker = function(place){
        GmapService.setMarker(place);
    };
    
    this.initMap = function(){
        GmapService.initMap();
    };
    
})
.controller('HomeController', function($http){
    var controller = this;
    $http({url:'/getNews', method:'GET'}).success(function(getData){
        controller.news = getData.news;
    });
});
