module.exports = function(grunt) {
  
  var express = require('express'),
      fs = require('fs'),
      path = require('path');

  
    grunt.registerTask('express', function(target, proxyMethodToUse) {
      app = express(),
      app.get('/list', function(req, res){
        res.set('Content-Type', 'text/xml');
        res.send(fs.readFileSync(__dirname+'/res/list.xml'));
      });
      app.use(express.static(__dirname+'/../'));
      app.listen(3000);
      
    });

  

}