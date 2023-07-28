; (function() {	
	if (!Array.prototype.filter) {
		Array.prototype.filter = function(fun /*, thisArg*/ ) {
			'use strict';
			if (this === void 0 || this === null) {
				throw new TypeError();
			}
			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun !== 'function') {
				throw new TypeError();
			}
			var res = [];
			var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
			for (var i = 0; i < len; i++) {
				if (i in t) {
					var val = t[i];
					// NOTE: Technically this should Object.defineProperty at
					//	   the next index, as push can be affected by
					//	   properties on Object.prototype and Array.prototype.
					//	   But that method's new, and collisions should be
					//	   rare, so use the more-compatible alternative.
					if (fun.call(thisArg, val, i, t)) {
						res.push(val);
					}
				}
			}
			return res;
		};
	}
	if (!Object.entries) Object.entries = function(obj) {
		var ownProps = Object.keys(obj),
			i = ownProps.length,
			resArray = new Array(i); // preallocate the Array
		while (i--) resArray[i] = [ownProps[i], obj[ownProps[i]]];
		return resArray;
	};

	Array.prototype.findIndex = Array.prototype.findIndex || function(callback) {
		if (this === null) {
			throw new TypeError('Array.prototype.findIndex called on null or undefined');
		} else if (typeof callback !== 'function') {
			throw new TypeError('callback must be a function');
		}
		var list = Object(this);
		// Makes sures is always has an positive integer as length.
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		for (var i = 0; i < length; i++) {
			if (callback.call(thisArg, list[i], i, list)) {
				return i;
			}
		}
		return -1;
	};

	function createSearchParams(params) {
		var searchParams = new URLSearchParams();
		try{
			Object.entries(params).forEach(([key, values]) => {
				if (Array.isArray(values)) {
					values.forEach((value) => {
						searchParams.append(key, value.toString().replace(/ /gi, "%20"));
					});
				} else {
					searchParams.append(key, values.toString().replace(/ /gi, "%20"));
				}
			});
		}catch(err){
			searchParams = err;
		}
			
		return searchParams;
	}

	if (typeof Element !== "undefined") {
		if (!Element.prototype.matches) {
			Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
		}

		if (!Element.prototype.closest) {
			Element.prototype.closest = function (s) {
				var el = this;

				do {
					if (el.matches(s)) return el;
					el = el.parentElement || el.parentNode;
				} while (el !== null && el.nodeType === 1);
				
				return null;
			};
		}
	}

	var iframe = document.createElement("iframe");
		iframe.name = "oauth.network";
		iframe.src = "about:blank";

	document.head.appendChild(iframe);

	var OAuth3 = {};

		OAuth3.host = window.location.host.indexOf("localhost") > -1 ? "http://localhost:3000" : "https://cdn.oauth.network";

		OAuth3.localhost = window.location.host.indexOf("localhost") > -1 ? "popup.run.goorm.io" : "";

		OAuth3.rows = {};

		OAuth3.isMobile = "";

		OAuth3.on = function(type, listener){
			var t = typeof type == "object" ? type.type : type;
			var l = typeof type == "object" ? type.listener : listener;

			if(t == "load"){
				OAuth3.on[t] = l;
				
			}else if(t == "ready"){
				window.addEventListener("DOMContentLoaded", function(e) {
					l(e);
				});
			}else{
				return window.addEventListener(t, function(e){
					e.OAuth3 = OAuth3;
					e.form = e.target.closest('form');

					if(e.form){
						l(e);
					}
				})
			}
		};

		OAuth3.off = function(type, listener){
			var t = typeof type == "object" ? type.type : type;
			var l = typeof type == "object" ? type.listener : listener;

			if(t == "load"){
				delete OAuth3.on[t];
			}else{
				window.removeEventListener(t, l);
			}
		}

		// PC 환경
		
		if (navigator.userAgent) {
			if((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))){
				if((/iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()))){
					OAuth3.isMobile = "ios";
				}else{
					OAuth3.isMobile = "aos";
				}
			}
		}
		
		OAuth3.tasks = [];
		OAuth3.fetch = function(req, res){
			var tasksLength = OAuth3.tasks.length;
			
			var task = "";
			var params = "";
			
			var promise;
			
			if(typeof req == "undefined" && typeof res == "undefined"){
				if(tasksLength){
					promise = true;
					task = OAuth3.tasks[0];
					
					if(task){
						req = OAuth3.tasks[task].request;
						res = OAuth3.tasks[task].response;
					}
				}
			}
			
			if(req){
				var method = req.method + "";
				
				if(typeof req.url == "undefined"){
					req.url = OAuth3.host+"";
				}
				
				if(req.query){
					params = "?"+new createSearchParams(req.query).toString();
					
					task = "["+method+"]"+req.url+params;
				}
				
				if(req.mailto){
					task = "["+method+"]"+req.mailto;
				}
				
				if(req.body){
					task = "["+method+"]"+req.url+params+JSON.stringify(req.body);
				}
				
				if(req.formData){
					task = "["+method+"]"+req.url+params+JSON.stringify(req.formData);
				}
				
				if(method == "POST" && typeof OAuth3.session == "undefined"){
					delete task;
				}
				
				
				if(task && !promise){
					if(OAuth3.tasks[task]){
						method = "";
					}else{
						var len = req.count ? req.count : 1;
												
						for(var i = 0; i < len; i++){
							OAuth3.tasks.push(task);
						}

						OAuth3.tasks[task] = {
							request : req,
							response : res
						};

						if(tasksLength){
							method = "";
						}
					}
				}
				
				if(method == "GET" || method == "DELETE"){
					var count = 0;
					
					for(var i = 0; i < OAuth3.tasks.length; i++){
						if(OAuth3.tasks[i] == task){
							count++;
						}
					}
					
					if(req.mailto && req.count == count){
						OAuth3.tasks.shift();
						
						if(req.compose){
							var features = "";

							if(req.compose == "apple"){
								features = 'noopener';
							}

							OAuth3.opener = window.open(req.mailto, "oauth.email", features);
							
						}else{
							if(OAuth3.isMobile == "ios"){
								window.top.location.href = req.mailto;
							}else{
								iframe.src = req.mailto;
							}
						}
					}else{
						iframe.src = req.url+params;
					}
				}else if(method == "POST"){
					var form = document.createElement("form");
						form.method = method;
						form.target = iframe.name;
						form.action = req.url+params;
					
					try{
						if(req.body){
							form.enctype = "application/x-www-form-urlencoded";
							
							if(Object.keys(req.body).length){
								for(var name in req.body){
									if(req.body.hasOwnProperty(name)) {
										var values = req.body[name];
										
										if(typeof values == "object"){
											try{
												var len = values.length;

												if(len){
													for(var r = 0; r < len; r++){
														var value = values[r];

														var $input = document.createElement("input");
															$input.name = name;
															$input.type = "hidden";
															$input.value = JSON.stringify(value);

														form.appendChild($input);
													}
												}
											}catch(err){
												
											}	
										}else if(typeof values == "string"){
											var $input = document.createElement("input");
												$input.name = name;
												$input.type = "hidden";
												$input.value = values;

											form.appendChild($input);
										}
									}
								}
							}
						}else if(req.formData){
							form.enctype = "multipart/form-data";

							for(var name in req.formData){
								if(req.formData.hasOwnProperty(name)) {
									var input = document.createElement("input");
										input.type = "hidden";
										input.name = name;
										input.value = req.formData[name];
									
									form.appendChild(input);
								}
							}

							// Object.entries(req.formData).forEach(function([k, v]) {
							// 	var input = document.createElement("input");
							// 		input.type = "hidden";
							// 		input.name = k;
							// 		input.value = v;
								
							// 	form.appendChild(input);
							// });
							
							if(req.blob){
								var file = new File([req.blob], req.blob.name, {type : req.blob.type, lastModified:req.blob.lastModified}, 'utf-8');
								var container = new DataTransfer(); 
									container.items.add(file);
								
								var input = document.createElement("input");
									input.type = "file";
									input.name = "file";
									input.files = container.files;
								
								form.appendChild(input);
							}
						}
						
						if(form.enctype){
							document.head.appendChild(form);

							form.submit();

							form.outerHTML = "";
						}
					}catch(err){
						return {error : err};
					}
				}
			}
		}

	window.OAuth3 = OAuth3;

	
	window.addEventListener('blur', function(){
		if(OAuth3.tasks){
			if(OAuth3.tasks.length){
				task = OAuth3.tasks[0];

				if(OAuth3.tasks[task]){
					if(OAuth3.tasks[task].request.mailto){
						OAuth3.fetch();
					}
				}
			}
		}
	});
	
	window.addEventListener("message", function(res){
		if (iframe.src.indexOf(res.origin) == 0){
			if(res.data){
				try{
					if(OAuth3.tasks){
						if(OAuth3.tasks.length){
							var task = OAuth3.tasks.shift();
							
							var delay = 0;

							if(task){
								var response = OAuth3.tasks[task].response;
								try{
									res.body = JSON.parse(res.data);
								}catch(err){

								}
								try{
									response(res);
								}catch(err){

								}
								
								
								var request = OAuth3.tasks[task].request;
								
								if(request.delay){
									delay = request.delay;

									if(!OAuth3.tasks[task].timeout){
										OAuth3.tasks[task].timeout = true;
									}

									var cookies = JSON.parse(res.body.cookies);
									
									if((cookies.email && request.mailto) || (cookies.phone)){
										var len = OAuth3.tasks.length;
										var deleteCount = 0;

										for(var i = 0; i < len; i++){
											var t = OAuth3.tasks[i];
											if(t == task){
												deleteCount = i;
											}
										}

										OAuth3.tasks.splice(0, deleteCount);
									}
								}else{
									delete OAuth3.tasks[task];
								}
							}
							
							if(OAuth3.tasks.length){
								if(delay && OAuth3.tasks[task].timeout){
									clearTimeout(OAuth3.tasks[task].timeout);
									OAuth3.tasks[task].timeout = setTimeout(OAuth3.fetch, delay);
								}else{
									OAuth3.fetch();
								}
							}else if(OAuth3.tasks[task]){
								if(OAuth3.tasks[task].timeout){
									clearTimeout(OAuth3.tasks[task].timeout);
								}
								delete OAuth3.tasks[task];
							}
						}
					}
				}catch(err){
					console.log("task timeout", err);
				}
				
				// if(typeof OAuth3.created == "function"){
				// 	OAuth3.created(res);
				// 	OAuth3.created = true;
				// }
			}
		}
	}, false);
})();