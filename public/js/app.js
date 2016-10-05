angular.module('SwatAngular', ['ngRoute'])
.config(['$routeProvider', function($routeProvider){
    $routeProvider
    .when('/', {
        redirectTo: '/home'
    })
    .when('/home/', {
        templateUrl: 'templates/pages/home.html',
        controller: 'HomeController',
        controllerAs: 'homeCtrl'
    });

}]);
