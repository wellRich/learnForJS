;
(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define(["jquery"], function ($) {
            return factory($);
        });
    } else {
        // 全局模式
        factory(jQuery);
    }
}(this, function($) {
    var SearchTool = function (options) {
        this.options = SearchTool.options;
        this.initOptions(options);
        this.richTable();
        this.getThisInstance();
    };
    SearchTool.version = "1.0";

    SearchTool.options = {
        isHide: false,
        locale: 'zh-CN',
        isApposed: false//是否启用并行列，一行tr有两个搜索条件共6列td，默认是一行tr一个搜索条件共3列td
    };

    SearchTool.getOptions = function () {
        return this.options;
    };

    SearchTool.searchers = {};


    SearchTool.setSearcher = function (searcher) {
        SearchTool.searchers[searcher.getId()] = searcher;
        return searcher;
    };

    SearchTool.getSearcher = function (id) {
        var searcher = null;
        if(typeof SearchTool.searchers[id] !== 'undefined'){
            searcher = SearchTool.searchers[id];
        }
        return SearchTool.searchers[id];
    };

    SearchTool.addSearcher = function(searcher){
        return SearchTool.setSearcher(searcher);
    };

    //激活日期选择器
    function activateDatePicker(ops){
        $(".date-picker ").each(function(i, e) {
            $(e).datepicker({
                orientation: "left",
                autoclose: true,
                format: "yyyy-mm-dd",
                pickerPosition: "bottom-left",
                language: ops.locale
            });
        });
    };



    /**
     * 组装表格
     * @param searchFields 搜索的字段
     * @param $vessel 表格父节点,容器
     * @param _tableId 分配的表格id,html的id命名空间
     * @returns {*|HTMLElement}
     */
    SearchTool.richTable = function() {
        var  handle = this, options = handle.options, id = options.id;
        console.log("richTable.options--> ", options);
        var table = $('<table cellspacing="0" id="' + id + '" style="width: 100%" class="display'+ (this.options.isHide ? 'hidden' : '') +' table-striped table-bordered table-hover table-condensed" ></table>');
        //拼装各搜索条件
        var scopeFields = [], //含有between选项的数据类型
            tbody = document.createElement("tbody"), searchFields = this.options.searchFields;
        if ( searchFields === undefined || searchFields === null) {
            console.warn("richTable of ---> " + searchFields + " <---------");
        } else {
            if (options.isApposed) {
                var size = searchFields.length, trNums = 0, trs = {};
                if (size % 2 == 0) {
                    trNums = size / 2;
                } else {
                    trNums = (size + 1) / 2;
                }
                table.append($('<thead><th style="width: 14%">字段名</th><th style="width: 9%">操作符</th><th style="width: 27%">查询值</th>' +
                    '<th style="width: 14%">字段名</th><th style="width: 9%">操作符</th><th style="width:27%">查询值</th></thead>'));
                for (var j = 0; j < trNums; j++) {
                    trs[j] = document.createElement("tr");
                }
                //console.log("trs--> ", trs);
                var leftTr = document.createElement("tr"), rightTr = document.createElement("tr");
                for (var i = 0; i < size; i++) {
                    var e = searchFields[i];
                    if (e.dataType == "date" || e.dataType == "number") {
                        scopeFields.push(e.field);
                    }
                    var oper_Input = getOperations(e, id), tr, index;
                    if (i % 2 == 1) {
                        index = (i + 1) / 2 - 1;
                        tr = trs[index];
                    } else {
                        index = i / 2;
                        tr = trs[index];
                    }
                    //console.log("tr--> ", tr, index);
                    tr.innerHTML = tr.innerHTML + "<td>" + e.title + "</td> <td>" + oper_Input.ops + "</td><td> " + oper_Input.input + " </td>";
                    tbody.appendChild(tr);
                }
            } else {
                table.append($('<thead><th style="width: 14%">字段名</th><th style="width: 9%">操作符</th><th style="width: 27%">查询值</th>'));
                searchFields.forEach(function (e) {
                    if (e.dataType == "date" || e.dataType == "number") {
                        scopeFields.push(e.field);
                    }
                    var tr = document.createElement("tr"),
                        oper_Input = getOperations(e, id);
                    tr.innerHTML = "<td>" + e.title + "</td> <td>" + oper_Input.ops + "</td><td> " + oper_Input.input + " </td>";
                    tbody.appendChild(tr);
                });
            }

            table.append(tbody);
            options.vessel.prepend(table);

            //添加默认的逻辑连接词
            options.vessel.append(' <input type="hidden" id="' + id + '_logicType" value="and">');

            //添加操作按钮
            var modalFooter = document.createElement("div");
            options.vessel.append(modalFooter);
            modalFooter.setAttribute("class", "modal-footer " + (options.isHide ? "hidden" : ""));
            modalFooter.innerHTML = '<button type="button"  id="' + id + '_dsSearch" class="btn dark btn-primary btn-outline">搜索</button>' +
                '<button type="button" id="' + id + '_dsReset" class="btn dark btn-info btn-outline">清空</button>';
            /*'<button type="button" data-dismiss="modal" class="btn dark btn-outline">关闭</button>';*/
            $("#" + id + "_dsReset").on("click", function(event) {
                if(options.resetBtnEvent !== undefined){
                    options.resetBtnEvent(handle);
                }else{
                    resetFrm(id);
                }
            });

            var searchBtn = $(document.getElementById(options.id + "_dsSearch"));
            searchBtn.on("click", function (event) {
                if( options.searchBtnEvent !== undefined){
                    options.searchBtnEvent(handle);
                }else {
                    console.warn('未配置搜索按键点击事件');
                }
            });
            this.scopeChangeWatch(scopeFields, options);
            this.activateDatePicker(options);
            return table;
        }
    };


    /**
     *  拼装搜索条件
     * @param searchFields
     * @param _tableId
     */
    SearchTool.getSearchInfo = function () {
        var colInfo = [], id = this.options.id;
        this.options.searchFields.forEach(function(e, i) {
            var field = e.field,
                idbody = field + "_" + id,
                value = $(document.getElementById(idbody + "_in")).val(),
                operation = $(document.getElementById(idbody)).val();
            //console.log("value--> ", value);
            if (value !== null && value !== "" && value !== undefined) {
                if (operation == "between") { //范围选择
                    var endValue = $(document.getElementById(idbody + "_end")).val();
                    if (endValue !== null && endValue !== "" && endValue !== undefined) {
                        colInfo.push({
                            operation: operation,
                            field: field,
                            value: value > endValue ? value + "," + endValue : endValue + "," + value
                        });
                    }
                } else {
                    colInfo.push({
                        operation: operation,
                        field: field,
                        value: value
                    });
                }
            }

        });
        return {
            colInfo: colInfo,
            logicType: document.getElementById(this.options.id + "_logicType").value
        };
    };

    /*SearchTool.searchBtnEvent = function (act) {
        var btn = $(document.getElementById(this.options.id + "_dsSearch"));
        btn.on("click", function (event) {
            act(this);
        });
    };*/

    SearchTool.prototype = {
        constructor: SearchTool,
        richTable: SearchTool.richTable,
        scopeChangeWatch: scopeChangeWatch,
        getSearchInfo: SearchTool.getSearchInfo,
        getOptions: SearchTool.getOptions,
        activateDatePicker: activateDatePicker,
        initOptions: function (options) {
            this.options = $.extend(true, this.options, options);
            //console.log("this.options--> ", this.options);
            return this;
        },
        getThisInstance: function () {
            SearchTool.addSearcher(this);
            return this;
        },
        getSearcher: SearchTool.getSearcher(),
        getId: function () {
            return this.options.id;
        }
    };
    
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

    function setListSelect(row, name, tableId) {
        return setEnumSelect(row, name, tableId);
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

    //给范围选择器添加onChange事件
    function scopeChangeWatch(scopeFields, ops) {
        //console.log("scopeFields--> ", scopeFields);
        scopeFields.forEach(function(e) {
            var selector = "#" + e + "_" +ops.id,
                selection = $(selector),
                startInput = $(selector + "_in"),
                sp = $(selector + "_s"),
                endInput = $(selector + "_end");
            //console.log("selection--> ", selection);
            selection.on("change", function(event) {
                //console.log("this--> ", this);
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

    return SearchTool;
}));