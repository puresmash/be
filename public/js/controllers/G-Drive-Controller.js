angular.module('SwatAngular')
.controller('HomeController', function($http, $routeParams){
    var controller = this;
    
    console.log("CoDe = " + $routeParams.token);
    
    controller.token = $routeParams.token;
    
    this.getDriveMeta = function(week){
        controller.title = "第" + week +"週繳交狀況";
        controller.week = week;
            
        if(controller.token){
            var path = '/getDrive?token='+controller.token+"&week="+week;
            
            $http({url:path, method:'GET'}).success(function(getData){
                console.log(getData);
                controller.handOver = getData;
                
            });
        }
    
    
    };
    
    
//    var url = "https://www.googleapis.com/drive/v2/files?q='0BxEpP1_UMgOqfnRqM2ZIRm5YekhIMlJVM2lBRXNOVHZwSnJjV2hiYTYxSTV3WXZFQ0M0VlE'+in+parents&key={YOUR_API_KEY}"; 
});
