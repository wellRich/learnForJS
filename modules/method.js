exports.method = (function(n){
	n.version = '1.0.0';
	n.name = "method";
	/**
	 *
	 * @param fiducialDate 基准日期
	 * @param diff 变化天数
	 * @returns  yyyy-MM-dd格式的字符串
	 */
	var moveDate = function(fiducialDate, diff){
	    var day = 24 * 60 * 60 *1000;
	    try{
	        var date = new Date(fiducialDate);
	        date = date.valueOf();
	        date = date + diff * day;
	        date = new Date(date);
	        var m = date.getMonth() + 1;
	        if(m.toString().length == 1){
	            m='0'+m;
	        }
	        var d = date.getDate();
	        if(d.toString().length == 1){
	            d='0'+d;
	        }
	        return date.getFullYear() + "-" + m + "-" + d;
	    }catch(e){
	        console.info("e---------->" + e);
	        return null;
	    }
	};

	/**
	 *
	 * @param start yyyy-mm-dd起始日期
	 * @param end   yyyy-mm-dd终止日期
	 * @returns 两个时间点相差的天数
	 */
	var dateDiff = function(start, end){
	    var day = 24 * 60 * 60 *1000;
	    try{
	        var dateArr = end.split("-");
	        var checkDate = new Date();
	        checkDate.setFullYear(dateArr[0], dateArr[1]-1, dateArr[2]);
	        var checkTime = checkDate.getTime();

	        var dateArr2 = start.split("-");
	        var checkDate2 = new Date();
	        checkDate2.setFullYear(dateArr2[0], dateArr2[1]-1, dateArr2[2]);
	        var checkTime2 = checkDate2.getTime();

	        var diff = (checkTime - checkTime2)/day;
	        return Math.round(diff);
	    }catch(e){
	        return null;
	    }
	};

	var map = function(){
		var keys = new Array();
		var values = new Array();
		this.keys = keys;
		this.values = values;
		if(typeof this.put != "function"){
			var proto = map.prototype;
			proto.remove =  function(key){
				var tag = keys.indexOf(key);
				if(tag > -1){
					keys.splice(tag, 1);
					values.splice(tag, 1);
					return true;
				}else{
					return false;
				}
			};
			proto.put = function(key, value){
				var tag = keys.indexOf(key);
				if(tag > -1){
					keys[tag] = key;
					values[tag] = value;
				}else{
					keys[keys.length] = key;
					values[values.length] = value;
				}
			};
			proto.get = function(key){
				var tag = keys.indexOf(key);
				if(tag> -1){
					return values[tag];
				}else{
					return undefined;
				}

			};
			proto.containKey = function(key){
				return  keys.indexOf(key) > -1;
			};
			proto.getKeys = function(){
				return (function(target){
					return target;
				})(keys);
			};
			proto.getValues = function(){
				return (function(n){
					return n;
				})(values);
			};
		}
	};
	n.map = map;
	n.dateDiff = dateDiff;
	n.moveDate = moveDate;
	return n;
})({});

