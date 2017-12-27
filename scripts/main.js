var require = {
	baseUrl: ".././",
	map: {
		'*': {
			//'css': 'requireJS/css.min'
			'css': 'scripts/require-css'
		}
	},
	paths: {
		"jquery": "vendor/jquery/jquery-2.2.3.min",
		"bootstrap": "vendor/bootstrap/js/bootstrap.min",


		//时间控件
		"bootstrap-datepicker": "vendor/bootstrap/plugins/bootstrap-datepicker/js/bootstrap-datepicker.min",
		"datepicker-zh-CN": "vendor/bootstrap/plugins/bootstrap-datepicker/locales/bootstrap-datepicker.zh-CN.min",
		"bootstrap-datetimepicker": "vendor/bootstrap/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min",
		"datetimepicker.zh-CN": "vendor/bootstrap/plugins/bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN",

		//datatables
		"datatables.net": "vendor/jquery/plugins/datatables/datatables.min",

		"myModule": "modules/develop",
		"datatables_extends" : "modules/datatables_extends",

		//d3库
		"d3": "vendor/d3/d3.min",
		"d3-cloud": "vendor/d3/d3-cloud/d3.layout.cloud",

		//自定义
		"searchTool": "modules/searcher"
	},
	shim: {
		"bootstrap": ["jquery", "css!vendor/bootstrap/css/bootstrap.min"],
		 //时间控件
        "bootstrap-datepicker": ["bootstrap", "css!vendor/bootstrap/plugins/bootstrap-datepicker/css/bootstrap-datepicker3"],
        "datepicker-zh-CN": ["bootstrap-datepicker"],

        "bootstrap-datetimepicker": ["css!vendor/bootstrap/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker"],
        "datetimepicker.zh-CN": ["bootstrap-datetimepicker"],

		"searchTool": ["datepicker-zh-CN"],

		"datatables.net": ["jquery", "css!vendor/jquery/plugins/datatables/jquery.dataTables.min"],
		"datatables_extends": ["datatables.net", "searchTool"]

		/*//d3
		"d3-cloud": {
			exports: "dc"
		}
*/
	}
};