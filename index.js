#!/usr/bin/env node

var request = require('request');
var inquirer = require('inquirer');
var validUrl = require('valid-url');
var cliSpinners = require('cli-spinners');
var spinner = cliSpinners['bouncingBar'];
var logUpdate = require('log-update');
var cheerio = require('cheerio')
var parse = require('url-parse')
var color = require('cli-color')
var stop = false;
var i = 0;
var wordpress_check = ['readme.html', 'rss', 'feed'];
var joomla_check = ['language/en-GB/en-GB.xml'];
var version = null;

var questions = [
{
    type: 'list',
    name: 'cms',
    message: 'CMS?',
    choices: [
      'Wordpress',
      'Joomla',
    ]
  },
  {
    type: 'input',
    name: 'uri',
    message: 'URL',
    validate: function(value) {
    	if (!validUrl.isUri(value)){
	        return 'Incorrect url';
	    }
	    return true;
    }
  }
];

function load_site(url, cb) {
	request(url, function (error, response, html) {
	  	if (!error && response.statusCode == 200) {
	    	return cb(0, html)
	  	} else {
	  		return cb(1, 'Site is not load!')
	  	}
	});
}

inquirer.prompt(questions).then(function (answers) {
	setInterval(function(){
		if(stop) {
			process.exit(0);
		}
		var frames = spinner.frames;
		logUpdate(frames[i = ++i % frames.length] + ' Checking');
	}, spinner.interval)

	var parsed_url = parse(answers.uri, true);
	var complete_url = parsed_url.origin;

	switch(answers.cms) {
	  	case 'Wordpress':
	    	for(var c = 0; c < wordpress_check.length; c++) {
	    		load_site(complete_url+'/'+wordpress_check[c], function(err, html){
					var $ = cheerio.load(html)
					// check first readme.html
					if($('#logo').text().trim().length > 0 && wordpress_check[0]) {
						version = $('#logo').text().trim().split(' ')[1];
						console.log(color.green(answers.cms+' version: '+version))
						process.exit(0);
					} else if($('generator').text().length > 0 && (wordpress_check[1] || wordpress_check[2])) {
						version = $('generator').text().trim().split('=')[1];
						console.log(color.green(answers.cms+' version: '+version))
						process.exit(0);
					} else {
						console.log(color.red(answers.cms+' version: Unknown'))
						process.exit(0);
					}
				})
	    	}
	    	break

	  	case 'Joomla':  
	    	for(var c = 0; c < joomla_check.length; c++) {
	    		load_site(complete_url+'/'+joomla_check[c], function(err, html){
					var $ = cheerio.load(html)
					// check first readme.html
					if($('version').text().trim().length > 0 && joomla_check[0]) {
						version = $('version').text().trim();
						console.log(color.green(answers.cms+' version: '+version))
						process.exit(0);
					} else {
						console.log(color.red(answers.cms+' version: Unknown'))
						process.exit(0);
					}
				})
	    	}
	    	break

	  	default:
	    	console.log(color.red('cms is unknown'))
	    	process.exit(0);
	    	break
	}
});