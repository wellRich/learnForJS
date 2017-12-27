;
(function(root, factory) {
	if (typeof define === "function" && define.amd) {
		// AMD模式
		define(["jquery"], factory);
	} else {
		// 全局模式
		root.SearchTool = factory(jQuery);
	}
}(this, function($) {
	var SearchTool = {}
	SearchTool.version = "1.0";


	/**
	 * 清空
	 * @param formName
	 */
	function resetFrm(dom) {
		$("#" + dom).find('textarea, select, input').each(function() {
			if (!$(this).hasClass("notClean")) {
				$(this).val("");
			}
		});
		$("#" + dom).find('input[type="checkbox"]').each(function() {
			if (!$(this).hasClass("notClean")) {
				$(this).attr("checked", false);
			}
		});
	}

	//设置高级搜索器中的操作符、查询值输入框
	function setTextInput(field, tableId) {
		return {
			ops: '<select class="form-control input-sm notClean" id="' + field + '_' + tableId + '">' +
				'<option value="is">等于</option>' +
				'<option value="contains" selected>包含</option>' +
				'<option value="ends">以之结尾</option>' +
				'<option value="begins">以之开头</option>' +
				'</select>',
			input: '<input class="form-control input-sm" name="text" type="text" id="' + field + '_' + tableId + '_in"/>'
		};
	}

	function setNumInput(field, tableId) {
		return {
			ops: '<select class="form-control input-sm notClean" id="' + field + '_' + tableId + '">' +
				'<option value="is" selected>等于</option>' +
				'<option value="between">范围</option>' +
				'<option value="less">小于</option>' +
				'<option value="more">大于</option>' +
				'</select>',
			input: '<div class="form-inline"><input style="width: 100%" name="number" class="input-sm form-control" id="' + field + '_' + tableId + '_in"/>' +
				'<span id="' + field + '_' + tableId + '_s" class="hidden" style="margin-right: 2px; margin-left: 2px">-</span><input class="hidden input-sm form-control" name="number_end" style="width: 48%" id="' + field + '_' + tableId + '_end"/></div>'
		};
	}

	function setDateInput(field, tableId) {
		// console.log("setDate.field--> ", field);
		return {
			ops: '<select class="form-control input-sm notClean" id="' + field + '_' + tableId + '">' +
				'<option value="is" selected>等于</option>' +
				'<option value="between">范围</option>' +
				'<option value="less">之前</option>' +
				'<option value="more">之后</option>' +
				'</select>',
			input: '<div class="form-inline"><input style="width: 100%" name="date" class="date date-picker input-sm form-control" id="' + field + '_' + tableId + '_in"/>' +
				'<span id="' + field + '_' + tableId + '_s" class="hidden" style="margin-right: 2px; margin-left: 2px">-</span><input class="date hidden date-picker input-sm form-control" style="width: 48%" id="' + field + '_' + tableId + '_end"/></div>'
		}
	}

	function setListSelect(row, tableId) {
		return setEnumSelect(row, 'list', tableId);
	}

	function setEnumSelect(row, name, tableId) {
		var field = row.field;
		var input = '<select id="' + field + '_' + tableId + '_in" name=' + name + ' class="form-control input-sm">';
		if (row.items) {
			row.items.forEach(function(e) {
				input = input + '<option value="' + e.id + '"> ' + e.text + '</option>';
			});
		}
		input = input + '</select>';
		return {
			ops: '<select class="form-control input-sm notClean" id="' + field + '_' + tableId + '">' +
				'<option value="is" selected>等于</option>' +
				'<option value="notIs">不等于</option>' +
				'</select>',
			input: input
		};
	}

	//获取操作符,各部输入框的id为: field + "_" + domId +"_"/"_end"
	function getOperations(col, tableId) {
		var result = {
				ops: null,
				input: ''
			},
			field = col.field;
		switch (col.dataType) {
			case 'text':
				result = setTextInput(field, tableId);
				break;
			case 'number':
				result = setNumInput(field, tableId);
				break;
			case 'date':
				result = setDateInput(field, tableId);
				break;
			case 'list':
				result = setListSelect(col, 'list', tableId);
				break;
			case 'enum':
				result = setEnumSelect(col, 'enum', tableId);
				break;
			default:
				result = {
					ops: '<select class="form-control" id="' + field + '_' + tableId + '">' +
						'<option value="is" selected>等于</option>' +
						'</select>',
					input: '<input class="form-control input-sm " type="text" id="' + field + '_' + tableId + '_in"/>'
				};
				break
		}
		return result;
	}

	/**
	 * 组装表格
	 * @param searchFields 搜索的字段
	 * @param $vessel 表格父节点,容器
	 * @param _tableId 分配的表格id,html的id命名空间
	 * @returns {*|HTMLElement}
	 */
	SearchTool.richTable = function(searchFields, $vessel, _tableId) {
		console.log("richTable.searchFields--> ", searchFields);
		var table = $('<table cellspacing="0" id="' + _tableId + '_ds" style="width: 100%" class="display table-striped table-bordered table-hover table-condensed" ></table>');
		console.log("richTable.table--> ", table);
		//拼装各搜索条件
		table.append($('<thead><th style="width: 27%">字段名</th><th style="width: 18%">操作符</th><th style="width: 55%">查询值</th></thead>'));
		var scopeFields = [], //含有between选项的数据类型
			tbody = document.createElement("tbody");
		if (searchFields === undefined || searchFields === null) {
			console.warn("richTable of ---> " + searchFields + " <---------");
		} else {
			searchFields.forEach(function(e) {
				if (e.dataType == "date" || e.dataType == "number") {
					scopeFields.push(e.field);
				}
				var tr = document.createElement("tr"),
					oper_Input = getOperations(e, _tableId);
				tr.innerHTML = "<td>" + e.title + "</td> <td>" + oper_Input.ops + "</td><td> " + oper_Input.input + " </td>";
				tbody.appendChild(tr);
			});
			table.append(tbody);
			$vessel.prepend(table);

			//添加默认的逻辑连接词
			$vessel.append(' <input type="hidden" id="' + _tableId + '_logicType" value="and">');

			//添加操作按钮
			var modalFooter = document.createElement("div");
			$vessel.append(modalFooter);
			modalFooter.setAttribute("class", "modal-footer");
			modalFooter.innerHTML = '<button type="button"  id="' + _tableId + '_dsSearch" class="btn dark btn-primary btn-outline">搜索</button>' +
				'<button type="button" id="' + _tableId + '_dsReset" class="btn dark btn-info btn-outline">清空</button>' +
				'<button type="button" data-dismiss="modal" class="btn dark btn-outline">关闭</button>';
			$("#" + _tableId + "_dsReset").on("click", function(event) {
				resetFrm(_tableId + "_ds");
			});
			scopeChangeWatch(scopeFields);
			activateDatePicker();
			return table;
		}
	}

	//给范围选择器添加onChange事件
	function scopeChangeWatch(scopeFields) {
		scopeFields.forEach(function(e) {
			var selector = "#" + e,
				selection = $(selector),
				startInput = $(selector + "_in"),
				sp = $(selector + "_s"),
				endInput = $(selector + "_end");
			selection.on("change", function(event) {
				console.log("this--> ", this);
				if ($(this).val() == "between") {
					startInput.css("width", '48%');
					sp.removeClass("hidden");
					endInput.removeClass("hidden");
				} else {
					startInput.css("width", '100%');
					sp.addClass("hidden");
					endInput.addClass("hidden");
				}
			})
		});
	}

	//激活日期选择器
	function activateDatePicker() {
		$(".date-picker ").each(function(i, e) {
			//console.log("e--> ", e);
			$(e).datepicker({
				orientation: "left",
				autoclose: true,
				format: "yyyy-mm-dd",
				pickerPosition: "bottom-left",
				language: demand.locale
			});
		});
	}
	return SearchTool;
}));