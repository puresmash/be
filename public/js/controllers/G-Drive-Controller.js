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
                var ary = [];
                
                for(var i = 0; i < getData.length; i++){
                    for(key in getData[i]){
                        ary[key] = getData[i][key];   
                    }
                }
                
                console.log(ary);
                controller.handOverMap = ary;
                
            });
        }
    
    
    };
    
//    this.getUsers = function(){
        $http({url:'/getUsers', method:'GET'}).success(function(getData){
            controller.users = getData.users;
            console.log(getData);
        });
//    };

    this.getNote = function(id){
        $http({url:'/getNote?id='+id, method:'GET'}).success(function(getData){
            controller.notes = getData.notes;
            console.log(controller.notes);
        });
    };
    
    
    this.saveNote = function(note){
        console.log(note);
        $http({url: '/saveNote', method:'POST', data: note})
        .catch(function(note){
            controller.errors = note.data.error;
        });  
    };
    
    
//    var url = "https://www.googleapis.com/drive/v2/files?q='0BxEpP1_UMgOqfnRqM2ZIRm5YekhIMlJVM2lBRXNOVHZwSnJjV2hiYTYxSTV3WXZFQ0M0VlE'+in+parents&key={YOUR_API_KEY}"; 
});
