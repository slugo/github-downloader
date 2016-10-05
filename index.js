#!/usr/bin/nodejs
'use strict'
var https = require('https'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
	githubRawPath = "https://raw.githubusercontent.com",
	githubPath    = "https://www.github.com",
    projectName = process.argv[2].match(/github\.com(.*)/)[1],
    repositoryPath = "",
    seen = {};

function requestLinks(repository) {
    repositoryPath = repository || process.argv[2].match(/github\.com(.*)/)[1];
    var options = {
        "hostname": "github.com",
        "path": repositoryPath,
        "rejectUnauthorized": false,
        "method": "GET"
    };
    var req = https.request(options, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            var regex = new RegExp('<a href="(' + projectName + '/(?:blob|tree)/master.*?)"', "g"),
                match = regex.exec(body);
            while (match !== null) {
                if (match[1].indexOf('/tree') === -1) {
                    downloadFile(githubRawPath + match[1])
                } else if (!seen.hasOwnProperty(match[1]) ){
                    requestLinks(match[1]);
                }
                seen[match[1]] = 1;
                match = regex.exec(body);
            }
        });
    });
    req.end();
    req.on('error', function (e) {
        console.error(e);
    });
}

function downloadFile(url) {
    var parsedUrl = url.match(/\/([\w.]+)(.*)/),
        hostname = parsedUrl[1],
        filePath = parsedUrl[2].replace("/blob", ""),
        newDirectoryLocation = parsedUrl[2].substr(1),
        options = {
            "hostname": hostname,
            "path": filePath,
            "rejectUnauthorized": false,
            "method": "GET"
        };
    fs.exists(newDirectoryLocation,function(exists){
        if(!exists){
            mkdirp(path.dirname(newDirectoryLocation), function (err) {
                var file = fs.createWriteStream(newDirectoryLocation);
                var req = https.request(options, function (res) {
                    res.pipe(file);
                    file.on("finish",function(){
                       console.log("Downloaded: " + path.basename(newDirectoryLocation));
                    });
                });
                req.end();
                req.on('error', function (e) {
                    console.error("second");
                    console.error(e);
                });
            });
        }
    });
}
requestLinks();
