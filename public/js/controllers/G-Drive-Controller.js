angular.module('SwatAngular')
.controller('HomeController', function($http, $routeParams){
    var controller = this;
    
    this.weeks = [7, 8, 9, 10, 11, 12, 13, 14, 15];
    
    this.getYSheet = function(){
//        var ySheet = "https://docs.google.com/spreadsheets/export?id=1Zeyx3CTsnRIqbU0vjnBNe1NKECaYqQW_iOa_wh_uHuA&exportFormat=csv";
//        var googleUser = gapi.auth2.getAuthInstance().currentUser.get();
//        var access_token = googleUser['wc']['access_token'];
//        $http({url:ySheet,headers:{'Authorization': 'Bearer ' + access_token}, method:'GET'}).success(function(getData){
//            console.log(getData);
//        });
        var xhr = new XMLHttpRequest();
        var oauthToken = gapi.auth2.getToken();
        xhr.open('GET',
          'https://docs.google.com/spreadsheets/export?id=1Zeyx3CTsnRIqbU0vjnBNe1NKECaYqQW_iOa_wh_uHuA&exportFormat=csv');
        xhr.setRequestHeader('Authorization', 'Bearer ' + oauthToken.access_token);
        xhr.send();
    };
    
    this.getDriveMeta = function(week){
        controller.title = "第" + week +"週繳交狀況";
        controller.week = week;
            
//        if(controller.token){
            var path = '/getDrive';//?token='+controller.token+"&week="+week;
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
