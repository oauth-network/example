const express = require('express');

const url = require('url');
const https = require('https');

const crypto = require("crypto");

const cookie = require('cookie');

const app = express();
const port = 3000;

app.post('/oauth/', (req, res) => {
	const pathname = new URL(`https://${req.headers['host']}${req.url}`).pathname;
	const cookies = cookie.parse(req.headers.cookie || '');
	const referer = req.headers['referer'] ? req.headers['referer'] : "https://oauth3.vercel.app/";

	if(req.body.hash && req.body.token){
		var salt = new Date().getTime().toString();
		var _hash = req.body.hash;
		var _token = req.body.token;
		var state = crypto.createHash('sha256').update(salt+_hash+_token).digest('hex').toLowerCase();

		res
			.setHeader('Set-Cookie', [
				cookie.serialize('state', state, {
					httpOnly: true,
					secure: true,
					maxAge: 60 * 5
				})
			])
			.redirect(`https://oauth.network/?response_type=code&client_id=${process.env.oauth_client_id}&state=${state}&hash=${_hash}&token=${_token}&redirect_uri=https://oauth3.vercel.app/oauth/`);
	}else{
		res.redirect(referer)
	}
	
	
});

app.get('/oauth/', (req, res) => {
	const pathname = new URL(`https://${req.headers['host']}${req.url}`).pathname;
	const cookies = cookie.parse(req.headers.cookie || '');
	const referer = req.headers['referer'] ? req.headers['referer'] : "https://oauth3.vercel.app/";

	var data = {};

	try{
		var uri = new URL(referer);

		var _code = req.query.code;
		var _hash = uri.searchParams.get("hash") ? uri.searchParams.get("hash") : "";
		var _token = uri.searchParams.get("token") ? uri.searchParams.get("token") : "";

		if(_code){
			var Request = function(r){
				var options = {
					hostname: uri.host,
					port: 443,
					path: r.path,
					method: r.method,
					headers: r.headers ? r.headers : {}
				};

				return new Promise((resolve, reject) => {
					var _data = '';
					var _req = https.request(options, _res => {
						_res.on('data', chunk => { _data += chunk }) 

						_res.on('end', () => {
							try{
								var json = JSON.parse(_data);

								resolve(json);
							}catch(err){
								resolve(_data);
							}
						})
					})

					_req.on('error', (err) => {
						reject(err);
					});

					_req.end();
				});
			}

			try{
				var authorize = await Request({
					method : "POST",
					path : `/?grant_type=authorization_code&client_id=${process.env.oauth_client_id}&redirect_uri=https://oauth3.vercel.app/oauth/&code=${_code}&client_secret=${process.env.oauth_client_secret}`
				})

				var token = await Request({
					method : "POST",
					path : `/?hash=${_hash}&token=${_token}&scopes=email,phone`,
					headers : {
						"authorization": `bearer ${authorize.access_token}`,
						'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
					}
				})

				data = token;
			}catch(err){
				data = {
					error : 400,
					message : err
				}
			}
		}
	}catch(err){
		data = {
			error : 404,
			message : err
		}
	}

	res.send(data)
});



// basic
app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

// vercel use
// module.exports = app; 