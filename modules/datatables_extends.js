;
(function(factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define(["jquery", "searchTool"], factory);
    } else {
        // 全局模式
        factory(jQuery, SearchTool);
    }
}(function($, SearchTool, undefined) {
    $.fn.datatables_extends = function(demand, specialConfig) {
        //全局命名空间
        var PJ = {
            total: 0
        };

        var defaultConfig = {
            language: {
                url: demand.lang
            },
            ordering: true,
            order: [],
            orderMulti: true,
            pagingType: 'full_numbers',
            dom: '<"form-inline"<"input-group col-md-2"l><"input-group col-md-3"f>>rt<"row"<"col-md-6"i><"col-md-6"p>>', //修改datatables的表格控件布局、样式
            searching: true,
            autoWidth: false, //禁用自动调整列宽
            stripeClasses: ["odd", "even"], //为奇偶行加上样式，兼容不支持CSS伪类的场合
            serverSide: true, //启用服务器端分页
            iDisplayLength: 15, //默认每页显示的最大数据量
            aLengthMenu: [
                [10, 15, 25, 50, -1],
                [10, 15, 25, 50, "所有"]
            ],
            ajax: function(data, callback, setting) {
                var param = {};
                param.limit = data.length; //页面显示记录条数，在页面显示每页显示多少项的时候
                param.offset = data.start; //开始的记录序号
                param.page = (data.start / data.length) + 1; //当前页码
                var total = PJ.total;
                param.total = total;
                param.draw = data.draw;
                //排序
                var ordersInfo = getOrder(data.order, specialConfig.order, specialConfig.columns);
                if (ordersInfo.length > 0) {
                    param.sorts = JSON.stringify(ordersInfo);
                }
                //查询过滤条件
                var conditionsInfo = getColumnsInfo();
                param.filters = JSON.stringify(conditionsInfo);
                loadTable(param, callback, demand.url);
            },
            stateSave: true
        };

        //合并配置
        var config = $.extend(true, {}, defaultConfig, specialConfig);
        if (demand.ajaxSearch) {
            //修改主表datatables的dom
            config.dom = '<"#' + demand.domId + '_tool.form-inline "<"input-group col-md-2 pull-right"l>>rt<"row"<"col-md-6"i><"col-md-6"p>>';
        }


        //初始化主表
        var $tableDom = $("#" + demand.domId),
            tableHandle = $tableDom.on("draw.dt ", function(event, setting) {
                var pageInfo = tableHandle.api().page.info(), //分页信息
                    pageLength = pageInfo.length,
                    size = PJ.total,
                    $pageDiv = $("#" + demand.domId + "_paginate");
                //若总数据条数未超过每页数据最大数，则隐藏页码
                if (size <= pageLength) {
                    $pageDiv.hide();
                } else {
                    $pageDiv.show();
                }
            }).on("init.dt", function(event, settings, data) { //必须在datatables完成主表的初始化，才可以增加按键
                initDetails({tableHandle: tableHandle, locale: demand.locale});
            }).dataTable(config);

        // 暴露出来的搜索功能
        // 实现方式：重新加载datatables实现搜索
        function search() {
            tableHandle.api().ajax.reload();
        }

        /**
         *  初始化datatables高级搜索器
         * @param config
         */
        function initDetails(config) {
            var domId = demand.domId,
                searchInputId = domId + '_searchInfo',
                tool = $("#" + domId + "_tool");
            if (demand.ajaxSearch) { //使用后台搜索
                //增加搜索框
                var $searchDom = $('<div class="input-group" style="border:1px solid #5ec43f;"></div>'),
                    $modal = $("#" + (demand.vessel || 'detailSearch')); //模态框
                tool.append($searchDom);
                //是否使用高级搜索demand
                if (demand.detailSearch) {
                    $searchDom[0].innerHTML = '<input class="form-control input-sm " id="' + searchInputId + '" type="text"><span class="input-group-addon btn btn-primary btn-sm" id="' + domId + '_query">' +
                        '<i class="fa fa-search"></i>&nbsp;<span style="font-size: 14px">搜索</span>' +
                        '</span><span  class=" input-group-addon btn btn-warning btn-group-sm btn-circle" id="' + domId + '_reset">' +
                        '<i class="fa fa-times"></i>&nbsp;<span style="font-size: 14px">清空</span></span>' +
                        '<span  class=" input-group-addon btn-group-sm  btn btn-info btn-circle" id="' + domId + '_callSearch">' +
                        '<i class="fa fa-search"></i>&nbsp;<span style="font-size: 14px">高级搜索</span></span>';
                    //构建高级搜索组件
                    var result = build({
                        conditions: demand.conditions,
                        columns: specialConfig.columns,
                        domId: domId,
                        vessel: $("#" + (demand.dsFormId || "detailsFrm")),
                        locale: config.locale,
                        searchBtnEvent: function (dsTableInstance) {
                            var $table = $(document.getElementById(dsTableInstance.getId()));
                            if($table){
                                $("#" + domId + "_logicType").val("and");
                                search();
                                $modal.on("hidden.bs.modal", function(event) {
                                    $table.addClass("hidden"); //在模态框隐藏的时候，同时隐藏高级搜索表格
                                }).modal('hide');
                            }
                        },
                        resetBtnEvent: function (dsTableInstance) {
                            var $table = $(document.getElementById(dsTableInstance.getId()));
                            if($table){
                                resetFrm(dsTableInstance.getId());
                                $("#" + domId + "_logicType").val("and");
                                search();
                            }
                        }
                    });
                    var dsTableId = result.table.getId();
                    setDsSearchBtns(domId, $modal, dsTableId);
                    setGlSearchBtns(domId, searchInputId, result.searchFields, dsTableId);
                } else {
                    $searchDom[0].innerHTML = '<input class="form-control input-sm " id="' + searchInputId + '" type="text"><span class="input-group-addon btn btn-primary btn-sm" id="' + domId + '_query">' +
                        '<i class="fa fa-search"></i>&nbsp;<span style="font-size: 14px">搜索</span>' +
                        '</span><span  class=" input-group-addon btn btn-warning btn-group-sm btn-circle" id="' + domId + '_reset">' +
                        '<i class="fa fa-times"></i>&nbsp;<span style="font-size: 14px">清空</span></span>';
                    //只为保存搜索条件，高级搜索器会隐藏
                    setGlSearchBtnsOnly(domId, searchInputId);
                }
            }
        }

        /**
         * 构建高级搜索器
         * @param conditions 搜索条件
         * @param columns 列信息
         * @param domId 主表格id
         * @param vessel 容器,jquery对象
         * @param tableHandle datatables实例
         * @returns {*}
         */
        function build(args) {
            var tableId = args.domId + '_ds',
                table = document.getElementById(tableId);
            if (table === null) {
                if (args.conditions) {
                    table = new SearchTool({
                        searchFields: args.conditions,
                        searchBtnEvent: args.searchBtnEvent,
                        resetBtnEvent: args.resetBtnEvent,
                        locale: args.locale,
                        vessel: args.vessel,
                        id: tableId
                    });
                    return {
                        table: table,
                        searchFields: args.conditions
                    };
                } else {
                    var searchFields = getSearchFields(args.columns);
                    table = new SearchTool({
                        searchFields: searchFields,
                        searchBtnEvent: args.searchBtnEvent,
                        resetBtnEvent: args.resetBtnEvent,
                        locale: args.locale,
                        vessel: args.vessel,
                        id: tableId
                    });
                    return {
                        table: table,
                        searchFields: searchFields
                    };
                }
            }
        }

        /**
         * 从列信息中获取查询用字段
         * @param columns
         */
        function getSearchFields(columns) {
            var re = [];
            columns.forEach(function(e) {
                if (e.searchable) {
                    var temp = _.cloneDeep(e);
                    temp.field = e.data;
                    re.push(temp);
                }
            });
            return re;
        }

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

        /**
         * 设置模糊搜索的按钮，有高级搜索时
         * @param domId
         * @param searchInputId 模糊搜索输入框id
         * @param searchFields 搜索条件
         * @param dsTableId 高级搜索的表格id
         */
        function setGlSearchBtns(domId, searchInputId, searchFields, dsTableId) {
            var $searchInput = $(document.getElementById(searchInputId)),
                value = $searchInput.val();
            //模糊搜索
            $("#" + domId + "_query").on("click", function() {
                complexSearch(searchFields, domId, $searchInput.val());
            });

            $searchInput.keydown(function(event) {
                if (event.which == 13) {
                    complexSearch(searchFields, domId, $searchInput.val());
                }
            });

            //清空模糊搜索
            $("#" + domId + "_reset").on("click", function() {
                $searchInput.val("");
                //清空当前高级搜索表格的搜索条件
                resetFrm(dsTableId);
                search();
            });
        }


        /**
         * 设置模糊搜索的按钮，无高级搜索时
         * @param domId
         * @param $searchInput
         */
        function setGlSearchBtnsOnly(domId, searchInputId) {
            var $searchBtn = $("#" + domId + "_query"),
                $searchInput = $(document.getElementById(searchInputId));

            //模糊搜索
            $searchBtn.on("click", function() {
                simpleSearch(domId + "_ds");//增加“_ds”， 是因为之前生成高级搜索器时，使用的初始id=domId + "_ds"
            });

            $searchInput.keydown(function(event) {
                if (event.which == 13) {
                    simpleSearch(domId + "_ds");
                }
            });

            //清空模糊搜索
            $("#" + domId + "_reset").on("click", function() {
                $searchInput.val("");
                //清空当前表格的搜索条件
                $searchBtn.trigger("click");
                search();
            });
        }

        /**
         *  设置高级搜索用的按钮
         * @param domId
         * @param $modal
         * @param dsTableId
         */
        function setDsSearchBtns(domId, $modal, dsTableId) {
            var $table = $(document.getElementById(dsTableId));
            //click唤醒高级搜索模态框
            $("#" + domId + "_callSearch").on("click", function() {
                console.log("$table--> ", $table);
                //显示目标高级搜索表格
                $table.removeClass("hidden");
                $modal.modal('show');
            });
        }


        //进行模糊搜索时，同步高级搜索条件
        function syncDetail(conditions, domId, value) {
            console.log("syncDetail.conditions--> ", conditions);
            var detailsTable = document.getElementById(domId + "_ds");
            console.log("detailsTable--> ", detailsTable);
            //console.log("syncDetail.value--> ", value);
            //存在高级搜索，同步搜索条件
            if (detailsTable) {
                conditions.forEach(function(e, i) {
                    var dataType = e.dataType,
                        field = e.field,
                        idBody = field + "_" + domId + "_ds";
                    //console.log("idBody--> ", idBody);
                    if (dataType === "text") {
                        if (value !== null && value !== "") {
                            //field中含有“.”，使用$("#" + field)无效，所以使用原始的方式取得对象
                            $(document.getElementById(idBody)).val("contains");
                        }
                        $(document.getElementById(idBody + "_in")).val(value);
                    } else if (dataType === "number") {
                        if (value !== null && value !== "") {
                            $(document.getElementById(idBody)).val("is");
                        }
                        $(document.getElementById(idBody + "_end")).val(value);
                        $(document.getElementById(idBody + "_in")).val(value);
                    }
                });
            }
        }

        /**
         * 不存在高级搜索的情况，使用
         * @param searchTableId
         */
        function simpleSearch(searchTableId) {
            //设置逻辑连接符为or
            $("#" + searchTableId + "_logicType").val("or");
            search();
        }

        //模糊搜索
        function complexSearch(searchFields, domId, val) {
            //设置搜索条件
            syncDetail(searchFields, domId, val);
            simpleSearch(domId + "_ds");//使用高级搜索器的id
        }


        /**
         * //拼装搜索条件
         * @param columns 列信息
         * @param value 搜索输入框中的值
         */
        function buildSimpleColInfo(columns, domId) {
            //console.log("columns--> ", columns);
            var value = $("#" + domId + "_searchInfo").val(),
                colInfo = [];
            if (value) {
                var searchFields = getSearchFields(columns);
                if (searchFields.length === 0) {
                    console.warn("未设置供搜索的字段！");
                    searchFields = columns;
                }
                searchFields.forEach(function(col) {
                    var dataType = col.dataType;
                    //console.log("dataType--> ", dataType);
                    if (dataType !== "list" && dataType !== "enum") {
                        if (dataType == "text") {
                            colInfo.push({
                                operation: "contains",
                                field: col.field || col.data,
                                value: value
                            });
                        } else {
                            colInfo.push({
                                operation: "is",
                                field: col.field || col.data,
                                value: value
                            });
                        }

                    }
                });
            }
            return colInfo;
        }

        //获取各搜索条件
        function getColumnsInfo() {
            var defaultInfo = demand.searchInfo;
            var conditions = demand.conditions;
            if (demand.detailSearch) {
                //取得高级搜索的条件
                var searchFields = [];
                if (!conditions || conditions.length === 0) {
                    searchFields = getSearchFields(specialConfig.columns);
                } else {
                    searchFields = conditions;
                }
                var searcher = SearchTool.getSearcher(demand.domId + "_ds");
                if(searcher !== undefined){//高级搜索器是否已经初始化完毕
                    return {
                        manualFilters: searcher.getSearchInfo(),
                        defFilters: {
                            colInfo: defaultInfo,
                            logicType: "and"
                        }
                    };
                }else{
                    return {
                        defFilters: {
                            colInfo: defaultInfo,
                            logicType: "and"
                        }
                    }
                }
            } else {
                return {
                    manualFilters: {
                        colInfo: buildSimpleColInfo(specialConfig.columns, demand.domId), //拼装搜索条件
                        logicType: 'or'
                    },
                    defFilters: {
                        colInfo: defaultInfo,
                        logicType: "and"
                    }
                }
            }
        }

        //得到排序信息
        /**
         *
         * @param orderInfo 手动触发的排序
         * @param orderConfig 初始排序配置
         * @param columns 各数据列
         * @returns {Array}
         */
        function getOrder(orderInfo, orderConfig, columns) {
            var result = [];
            //console.log("orderInfo--> ", orderInfo);
            if (orderInfo.length > 0) {
                orderInfo.forEach(function(e) {
                    var column = columns[e.column].data;
                    if (column != undefined) {
                        result.push({
                            column: column,
                            dir: e.dir
                        });
                    }
                });
            } else {
                if (orderConfig !== undefined) {
                    orderConfig.forEach(function(e) {
                        var col = columns[e[0]].field;
                        if (col != undefined) {
                            result.push({
                                column: col,
                                dir: e[1]
                            });
                        }
                    });
                }
            }
            return result;
        }

        //执行查询，返回数据渲染表格
        /**
         *
         * @param params 传参
         * @param callback 回调
         * @param url 路径
         */
        function loadTable(param, callback, url) {
            $.ajax({
                url: url,
                type: "get",
                cache: false,
                data: param,
                dataType: "json",
                success: function(dat) {
                    //用后台传来的总数更新全局变量
                    PJ.total = dat.total;
                    var temp = {
                        draw: dat.draw,
                        recordsTotal: dat.recordsTotal,
                        recordsFiltered: dat.recordsFiltered,
                        total: dat.total,
                        data: JSON.parse(dat.data)
                    };
                    //console.log("loadTable.返回的数据--> ", temp);
                    //调用DataTables提供的callback方法，代表数据已封装完成并传回DataTables进行渲染
                    callback(temp);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("出错了！");
                }
            });
        }

        //返回搜索方法、主表datatables的handle
        return {
            search: search,
            tableHandle: tableHandle,
            commonObj: PJ
        }
    }
}));