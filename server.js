var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var url = require('url');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var formidable = require("formidable");
var util = require('util');
var hbs = require('hbs');


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'dist/views/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, '/dist')));


//render error page on all routes besides '/'
app.get('*', function(req, res) {
	res.status(404);
	res.render('error.hbs', { url: req.url });
});


//send the email to subscribe user
app.post('/subscribe', function(req, res) {
	var email = req.body.email.trim();

	var name = 'New User!';

	fs.exists('dist/json/users.json', function(exists) {
		if (exists) {
			fs.readFile('dist/json/users.json', function readFileCallback(err, data) {
				if (err){
					console.log(err);
				} else {
					var users = JSON.parse(data);
					var usersFiltered = users.filter(function(user) {
						return user.email === email;
					});
					if (usersFiltered.length > 0) name = usersFiltered[0].name;
				}
			});
		}
	});

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
		if(error){
			return console.log(error);
		}
		console.log('Message sent: ' + info.response);
		res.status(200).redirect('/');
	});
});


// add new user to users.json
app.post('/register', function(req, res) {
	var formData = req.body;

	fs.exists('dist/json/users.json', function(exists) {
		if (exists) {
			fs.readFile('dist/json/users.json', function readFileCallback(err, data) {
				if (err){
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
							image: formData.image || "default-img.png",
							name: formData.username + " " + formData.surname,
							email: formData.email.trim(),
							gender: formData.gender || "male",
							address: formData.address || "lorem ipsum",
							phone: formData.phone || '3804422211100',
							about: formData.about || "lorem ipsum",
							registered: new Date(),
							latitude: +formData.latitude,
							longitude: +formData.longitude,
							password: formData.password
						};

						users.push(user);
						var json = JSON.stringify(users);
						fs.writeFile('dist/json/users.json', json, function(err) {
							if (err){
								console.log(err);
							} else {
								res.status(201).end('User created!');
							}
						});
					}
				}
			});
		} else {
			console.log("file not exists")
			res.status(500).end('Not found users.json');
		}
	});
});


// check if user(email) is in users.json
app.post('/login', function(req, res) {
	var email = req.body.email.trim();
	var password = req.body.password.trim();

	fs.exists('dist/json/users.json', function(exists) {
		if (exists) {
			fs.readFile('dist/json/users.json', function readFileCallback(err, data) {
				if (err){
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
		} else {
			console.log("file not exists")
			res.status(500).end('Not found users.json');
		}
	});
});


//add new lot to data.json
app.post('/addlot', function(req, res) {
	var form = new formidable.IncomingForm();
	var fields = {};

	form.uploadDir = path.join(__dirname, '/dist/images/upload');

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
		console.log(util.inspect({
			fields: fields
		}));

		fs.exists('dist/json/data.json', function(exists) {
			if (exists) {
				fs.readFile('dist/json/data.json', function readFileCallback(err, data) {
					if (err){
						console.log(err);
					} else {
						var lots = JSON.parse(data);

						var lot = {
							_id: parseInt(lots[lots.length-1]._id) + 1,
							isActive: true,
							startBid: '$' + fields.startbid,
							price: '$' + fields.startbid,
							image: 'upload/' + fields.image || "default-img.png",
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
						var json = JSON.stringify(lots);
						fs.writeFile('dist/json/data.json', json, function(err) {
							if (err){
								console.log(err);
							} else {
								res.status(201).end('Lot added!');
							}
						});

					}
				});
			} else {
				console.log("file not exists")
				res.status(500).end('Not found data.json');
			}
		});
	});

	form.parse(req);
});


//add new bid (new price) to certain lot (data.json)
app.post('/addbid', function(req, res) {
	var bidForm = req.body;
	fs.exists('dist/json/data.json', function(exists) {
		if (exists) {
			fs.readFile('dist/json/data.json', function readFileCallback(err, data) {
				if (err){
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

					var json = JSON.stringify(lotsUpdated);
					fs.writeFile('dist/json/data.json', json, function(err) {
						if (err){
							console.log(err);
						} else {
							res.status(201).end('Bid added!');
						}
					});
				}
			});
		} else {
			console.log("file not exists")
			res.status(500).end('Not found data.json');
		}
	});
});


function incDate(days) {
	var date = new Date();
	date.setDate(date.getDate() + days);
	console.log(date);
	return date;
}

app.listen(port, function() {
	console.log(`Listening on port ${port}`);
});
