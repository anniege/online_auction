var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var url = require('url');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var formidable = require("formidable");
var util = require('util');
var hbs = require('hbs');

var jsonPath = 'dist/json/';

var routes = {
	lots: jsonPath + 'data.json',
	users: jsonPath + 'users.json'
}

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'dist/views/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, '/dist')));


//read lots data from data.json and pass it on client
app.get('/lots', function(req, res) {
	getDataFromFile(res, routes.lots, function(err, data) {
		if (err){
			console.log(err);
		} else {
			res.json(JSON.parse(data));
		}
	});
});

//read users data from users.json and pass it on client
app.get('/users', function(req, res) {
	getDataFromFile(res, routes.users, function(err, data) {
		if (err){
			console.log(err);
		} else {
			res.json(JSON.parse(data));
		}
	});
});


// render error page on all routes besides '/'
app.get('*', function(req, res) {
	res.status(404);
	res.render('error.hbs', { url: req.url });
});


//send the email to subscribe user
app.post('/subscribe', function(req, res) {
	var email = req.body.email.trim();
	var name = 'New User!';

	getDataFromFile(res, routes.users, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var users = JSON.parse(data);
			var usersFiltered = users.filter(function(user) {
				return user.email === email;
			});
			if (usersFiltered.length > 0) name = usersFiltered[0].name;
			sendEmail(email,name, res);
		}
	});
});


// add new user to users.json
app.post('/register', function(req, res) {
	var formData = req.body;

	getDataFromFile(res, routes.users, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var users = JSON.parse(data);

			var filtered = users.filter(function(user) {
				return formData.email.trim() === user.email;
			});

			if (filtered.length > 0) {
				console.log('User already exists!');
				res.status(406).end();
			} else {
				var user = {
					_id: parseInt(users[users.length-1]._id) + 1 || null,
					image: formData.image || "user.png",
					name: formData.username + " " + formData.surname,
					email: formData.email.trim(),
					gender: formData.gender || "male",
					address: formData.address || "lorem ipsum",
					phone: formData.phone || '3804422211100',
					about: formData.about || "lorem ipsum",
					registered: new Date(),
					latitude: +formData.latitude || 51.476852,
					longitude: +formData.longitude || -0.000500,
					password: formData.password
				};

				users.push(user);
				var json = JSON.stringify(users, null, 4);
				fs.writeFile(routes.users, json, function(err) {
					if (err){
						console.log(err);
					} else {
						res.status(201).end('User created!');
					}
				});
			}
		}
	});
});


// check if user(email) is in users.json
app.post('/login', function(req, res) {
	var email = req.body.email.trim();
	var password = req.body.password.trim();

	getDataFromFile(res, routes.users, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var users = JSON.parse(data);
			var filtered = users.filter(function(user) {
				return user.email.trim() === email;
			});

			if (filtered.length > 0) {
				var user = filtered[0];

				if (user.password == password) {
					res.status(200).send(user);
				} else {
					console.log('User password is not valid!');
					res.status(401).end();
				}

			} else {
				console.log('User with ' + email + ' doesn\'t exists!');
				res.status(401).end();
			}
		}
	});
});


//add new lot to data.json
app.post('/addlot', function(req, res) {
	var form = new formidable.IncomingForm();
	var fields = {};

	form.uploadDir = path.join(__dirname, '/dist/images/lots');

	form.on('file', function(field, file) {
		fields[field] = file.name;
		fs.rename(file.path, path.join(form.uploadDir, file.name));
	});


	form.on('field', function(field, value) {
		fields[field] = value;
	});

	form.on('error', function(err) {
		console.log('An error has occured: \n' + err);
	});

	form.on('end', function() {

		getDataFromFile(res, routes.lots, function(err, data) {
			if (err) {
				console.log(err);
			} else {
				var lots = JSON.parse(data);

				var lot = {
					_id: parseInt(lots[lots.length-1]._id) + 1,
					isActive: true,
					startBid: '$' + fields.startbid,
					price: '$' + fields.startbid,
					image: fields.image || "default-img.png",
					title: fields.title,
					userId: +fields.userId,
					about: fields.description,
					registered: new Date().toISOString(),
					ends: (!isNaN(Date.parse(fields.date))) ? fields.date : incDate(3),
					buyerId: 0,
					latitude: fields.latitude,
					longitude: fields.longitude,
					tags: [fields.category]
				};

				lots.push(lot);
				var json = JSON.stringify(lots, null, 4);
				fs.writeFile(routes.lots, json, function(err) {
					if (err) {
						console.log(err);
					} else {
						res.status(201).end("Lot was added!");
					}
				});
			}
		});
	});

	form.parse(req);
});


//add new bid (new price) to certain lot (data.json)
app.post('/addbid', function(req, res) {
	var bidForm = req.body;

	getDataFromFile(res, routes.lots, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			var lots = JSON.parse(data);
			var lotsUpdated = [];
			lotsUpdated = lots.map(function(lot) {
				if (lot._id === +bidForm.lotId) {

					if (parseInt(bidForm.price.slice(1)) > parseInt(lot.price.slice(1))) {
						lot.price = bidForm.price;
						lot.buyerId = +bidForm.buyerId;
					}

				}
				return lot;
			});

			var json = JSON.stringify(lotsUpdated, null, 4);
			fs.writeFile(routes.lots, json, function(err) {
				if (err){
					console.log(err);
				} else {
					res.status(201).end(bidForm.price);
				}
			});
		}
	});
});

function getDataFromFile(res, filePath, readFileCallback) {
	fs.exists(filePath, function(exists) {
		if (exists) {
			fs.readFile(filePath, readFileCallback);
		} else {
			console.log('File dosen\'t exist!');
			res.status(500).end('File not found');
		}
	});
}

function sendEmail(email, name, res) {
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'onlineauctionusa@gmail.com',
			pass: '123qwertyu'
		}
	});

	var mailOptions = {
		from: 'onlineauctionusa@gmail.com',
		to: email,
		subject: 'Subscribe Online Auction news!',
		html: '<div><h1>Dear, <b>'+ name +'</b>!</h1> <p>Thank you for subscribing on our news!</p><p>Best regards,</p><p><b>Online Auction Team</b>.</p></div>' // You can choose to send an HTML body instead
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			console.log(error);
		}
		console.log('Message sent: ' + info.response);
		res.status(200).redirect('/');
	});
}


function incDate(days) {
	var date = new Date();
	date.setDate(date.getDate() + days);
	return date;
}

app.listen(port, function() {
	console.log('Listening on port ' + port);
});
