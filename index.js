var request = require('request')
var mqtt = require('mqtt')
var schedule = require('node-schedule')
var suncalc = require('suncalc')
var moment = require('moment')

var client = mqtt.connect("mqtt://localhost")

var dark = false

function setSchedule(date) {
	date = date || new Date()
	
	var times = suncalc.getTimes(date, 51, 0)

	if (moment(times.sunrise).isAfter(moment(date))) {
		console.log('There is a SUNRISE today, setting up job')
		var sunriseJob = schedule.scheduleJob(times.sunrise, function() {
			dark = false
			console.log('It is light now (',date,'). Sunrise was ',times.sunrise)
		})
	} else {
		console.log('Its after SUNRISE, will set up job tomorrow')
		dark = false //its after sunrise, so daylight
	}
	if (moment(times.sunset).isAfter(moment(date))) {	
		console.log('There is a SUNSET today, setting up job')
		var sunsetJob = schedule.scheduleJob(times.sunset, function() {
			dark = true
			console.log('It is dark now (',date,'). Sunset was ',times.sunset)
		})
	} else {
		console.log('Its after SUNSET, will set up job tomorrow')
		dark = true //sunset has already happened today, so its dark
	}
}

schedule.scheduleJob('03 0 * * *', setSchedule())

client.on('message', function(topic, payload) {
	if (dark && moment().isBefore(moment.endOf('day').subtract(1, 'hours'))) {
		console.log('It\'s dark and someone is here, turning on the lights')
		client.publish('lights/on')
	} else {
		console.log('Somone is here, but it\'s too bright for lights')
	}

	var topicComponents = topic.split('/')
	if (topicComponents[1]=='desk') {
		console.log('DESK MOTION')
	} else if (topicComponents[1]=='bed') {
		console.log('Bed motion')
	}
})

client.on('connect', function() {
	client.subscribe('motion/#')
})


