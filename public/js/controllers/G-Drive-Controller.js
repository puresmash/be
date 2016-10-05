angular.module('SwatAngular')
.controller('HomeController', function($http, $routeParams){
    var controller = this;

    this.weeks = [1, 2];
    this.getDriveMeta = function(week){
        controller.title = "Week " + week +" hand-in rate";
        controller.week = week;

        var path = '/getDrive';
        console.log('GET DRIVE');
        $http({url:path, method:'POST', data:{week: week}}).success(function(getData){
            var ary = [];

            for(var i = 0; i < getData.length; i++){
                for(key in getData[i]){
                    ary[key] = getData[i][key];
                }
            }
            console.log(ary);
            controller.handOverMap = ary;
        }).error(function(getData, status, c, d, e){
            controller.errorCode = getData.code;
            controller.errorMsg = getData.errors[0].message;
            console.log(getData);
        });
    };

    $http({url:'/getUsers', method:'GET'}).success(function(getData){
        controller.users = getData.users;
        console.log(getData);
    });

    this.dropdown = function($event){
        $($event.currentTarget).trigger('click.bs.dropdown.data-api');
        // $($event.currentTarget).dropdown();
    }
});
