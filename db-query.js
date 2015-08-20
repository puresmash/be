var qs = require('querystring');

exports.parseReceivedData = function(req, callback){
    var body = '';
    req.sendEncoding('utf8');
    req.on('data', function(chunk){ body += chunk });
    req.on('end', function(){
        var data = qs.parse(body);
        callback(data);
    });
    
};

exports.add = function(db, req, res){
    exports.parseReceivedData(req, function(work){
        db.query(
            "INSERT INTO work";
        );
    });
};