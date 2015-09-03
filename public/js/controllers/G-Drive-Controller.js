angular.module('SwatAngular')
.controller('HomeController', function($http, $routeParams){
    var controller = this;
    
    console.log("CoDe = " + $routeParams.token);
    
    controller.code = $routeParams.token;
    
    this.getDriveMeta = function(week){
        controller.title = "第" + week +"週繳交狀況";
        controller.week = week;
            
//        if(controller.token){
            var path = '/getDrive';//?token='+controller.token+"&week="+week;
            console.log('GET DRIVE');
            $http({url:path, method:'POST', data:{code: controller.code, week: week, user: ''}}).success(function(getData){
                var ary = [];
                
                for(var i = 0; i < getData.length; i++){
                    for(key in getData[i]){
                        ary[key] = getData[i][key];   
                    }
                }
                
                console.log(ary);
                controller.handOverMap = ary;
                
            }).error(function(getData, status, c, d, e){
                controller.error = getData;
                console.log(getData);
                console.log("status:"+status);
                console.log(c);
                console.log(d);
            });
//        }
//        else{
//            
//        }
    
    
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
