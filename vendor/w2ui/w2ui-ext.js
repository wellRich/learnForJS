w2obj.grid.prototype.doBeforeSearch = function (event) {
    if(event.multi === false && event.searchField === 'all'){
        for(var i=0; i<this.searches.length; i++){
            var search = this.searches[i];
            if(search.simple === false) {
                event.searchData = event.searchData.filter(function(el){
                    return el.field !== search.field;
                });
            }
        }
    }
};
w2obj.grid.prototype.emptyRecord = function (recid){
    var record = this.get(recid);
    for(index in record) if(index !== 'recid') record[index] = undefined;
}

w2obj.grid.prototype.exportData = function (type, showFields){
    var arrData = this.records;
    //var arrData = typeof data != 'object' ? JSON.parse(data) : data;
    var fileName = 'ExportData.' + type;
    var data = '';
    var columns = this.columns;
    var fields = [], captions = [];
    for (var i=0; i<columns.length; i++) {
        fields.push(columns[i].field);
        captions.push(columns[i].caption);
    }
    // show fields on first row ?
    if (showFields) {
        var row = "";
        for (var idx in captions) {
            if (row !="" && type == 'csv') row +=',';
            row += captions[idx] + '\t';
        }
        row = row.slice(0, -1);
        data += row + '\r\n';
    }
    // Prepare array data format
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        for (var j=0; j<fields.length; j++) {
            var field = fields[j];
            var cellValue = this.parseField(arrData[i], field);
            cellValue = cellValue ? cellValue : '';
            if (row !="" && type =='csv') {
                cellValue = String(cellValue).replace(/,/g, "|").replace(/"/g, "'"); //转义处理
                row +=',';
            }
            row += (type == 'xls') ? '"' + cellValue + '"\t' :  cellValue + '\t'
        }
        row.slice(0, row.length - 1);
        data += row + '\r\n';
    }
    // No data?
    if (data == '') {
        w2alert('No Data Found');
        return;
    }
    var BOM = "\uFEFF";
    data = BOM + data;

    var link = document.createElement("a");
    // browser with HTML5 support download attribute
    if (link.download !== undefined) {

        var uri = 'data:application/vnd.ms-excel,' + encodeURIComponent(data);
        link.setAttribute ( 'href', uri);
        link.setAttribute('style', "visibility:hidden");
        link.setAttribute ('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    // IE 10,11+
    else if (navigator.msSaveBlob) {
        var blob = new Blob([data], {
            "type": "text/csv;charset=utf8;"
        });
        navigator.msSaveBlob(blob, fileName);
    }
    // old IE 9-  remove this part ?? deprecated browsers ??
    var ua = window.navigator.userAgent;
    var ie = ua.indexOf('MSIE ');
    if ((ie > -1)) {
        if (document.execCommand) {
            var oWin = window.open("about:blank","_blank");
            oWin.document.write(data);
            oWin.document.close();
            var success = oWin.document.execCommand('SaveAs', true, fileName)
            oWin.close();
        }
    }
}

w2obj.grid.prototype.transformRecord = function (record) {
    return record;
}