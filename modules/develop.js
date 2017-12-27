define("myModule", ["jquery"], function($){
	var module = {};

	function dos(){
		console.log("I'm a module.");
	}
	module.dosomething = dos;
	module.version = "1.0";
	return module;
})