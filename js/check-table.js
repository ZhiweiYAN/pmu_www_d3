//Global variables in the page.
var g_data = [];
var g_abstract_data = [];

// The number of only effective disturbance
var num_eff_distu = 0;
// The number of qualified only effective disturbance
var num_qualified_eff_distu = 0;
// The number of ALL disturbance
var num_distu = 0;
// The number of qualified disturbance
var num_qualified_distu = 0;

var g_columns = [];
var g_file_content = [];

//Set current Month date
function SetCurrentMonth(){
    document.getElementById("StartTime").value = GetFirstDayTimestampOfCurrentMonth();
    document.getElementById("EndTime").value = GetCurrentDayTimestampOfCurrentMonth();
}

//Create the table for display on web pages.
function tabulate(id, data, columns) {
    d3.selectAll("#" + id).remove();
    var table = d3.select("#detail").append("table")
        .attr("class", 'table table-striped table-bordered')
        .attr("id", id);
    var thead = table.append("thead");
    var tbody = table.append("tbody");

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(function (column) {
            return column;
        });

    // create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]};
            });
        })
        .enter()
        .append("td")
        .attr("style", "font-family: Courier")
        .attr("style", "font-size:15px")
        .html(function (d) {
            g_file_content.push(d.value);
            return d.value;

        });
    return table;
}

//Save the table into a file.
function SaveCheckTable() {

    var file_data = [];

    //For the table header
    file_data.push(g_file_content.shift());
    file_data.push("\r\n")

    //For the table rows
    for (var i = 0; i < g_file_content.length; i++) {
        file_data.push(g_file_content[i].toString() + ',');
        if ((g_columns.length - 1) == i % g_columns.length) {
            file_data.push("\r\n")
        }
    }

    //Saving the tables into the specific file.
    var blob = new Blob(file_data, {type: "text/plain;charset=utf-8"});
    saveAs(blob, "check-result.txt");
}

//Send a SQL request to the server, and parse the response of the server
function LoadCheckTable() {

    g_data = [];
    g_abstract_data = [];
    g_file_content = [];

    num_eff_distu = 0;
    num_qualified_eff_distu = 0;
    num_distu = 0;
    num_qualified_distu = 0;

    var response_data = [];

    var start = document.getElementById("StartTime").value;
    var end = document.getElementById("EndTime").value;

    var ip_addr = document.getElementById("DBIPAddress").value;

    var radios = document.getElementsByName('DBTableName');
    var table = "pmu_chk_001";
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].type === 'radio' && radios[i].checked) {
            // get value, set checked flag or do whatever you need to
            table = radios[i].value;
        }
    }


    var json_request = " SELECT * "
        + " FROM " + table
        + " WHERE "
        + "start_time " + ">" + "'" + start + "'"
        + " AND "
        + "start_time" + "<" + "'" + end + "'"
        + " ORDER BY id";

    //BASE64 encoding
    var http_req = 'http://' + ip_addr + '/select?' + encode(json_request);


    //Send the request.
    d3.json(http_req, function (json) {

        if ('string' == typeof json) {
            alert("返回结果不正确！\n输入参数可能有误，请修正后重试。\n" + json);
            return;
        }
        var json_data = [];
        response_data = json.rows;
        console.log("The row number of data is: " + response_data.length);

        //clear the detail data
        var index = 1;
        g_data = [];
        response_data.forEach(function (d) {

            // Statistic
            num_distu++;
            if ('Y' == d.qualified_or_not) {
                num_qualified_distu++;
            }

            if ('1' == d.effective_disturbance) {
                num_eff_distu++;
                if ('Y' == d.qualified_or_not) {
                    num_qualified_eff_distu++;
                }
            }

            g_data.push({
                '#id': index++,
                '考核结果': function (v) {
                    if ('Y' == v) {
                        return "合格";
                    } else {
                        return "不合格";
                    }
                }(d.qualified_or_not),
                '出力方向': function (v) {
                    if ('Y' == v) {
                        return ' ';
                    }
                    else {
                        return '错误';
                    }
                }(d.direction_or_not),
                '免考核': function (v) {
                    if ('Y' == v) {
                        return '免考核';
                    } else {
                        return ' ';
                    }
                }(d.exempt_or_not),
                '扰动类型': function (v) {
                    if ('1' == v) {
                        return '有效扰动';
                    } else {
                        return ' ';
                    }
                }(d.effective_disturbance),
                '开始时刻': function (v) {
                    var d = new Date(v);
                    return d.toLocaleString("cmn-Hans-CN", {hour12: false});
                }(d.start_time),
                '结束时刻': d.end_time,
                '时长': d.time_span + ' 秒',
                '实际积分电量': function (v) {
                    var x = new Number(v);
                    return x.toFixed(2);
                }(d.hi),
                '理论积分电量': function (v) {
                    var x = new Number(v);
                    return x.toFixed(2);
                }(d.he),
                '贡献比': function (v) {
                    var x = new Number(v);
                    return x.toFixed(2);
                }(d.k),
                '前十秒平均功率': function (v) {
                    var x = new Number(v);
                    return x.toFixed(2);
                }(+d.p0),
                '极限频率': function (v) {
                    var x = new Number(v);
                    return x.toFixed(4);
                }(d.extreme_frequency)
            });
        });

        //For abstract information
        g_abstract_data.push({
            '参考合格率（所有扰动）': function (n1, n2) {
                var x = n1 / n2 * 100;
                return x.toFixed(1).toString() + '%' + ' = ' + n1.toString() + ' / ' + n2.toString();
            }(num_qualified_distu, num_distu),
            '省调合格率（仅有效扰动）': function (n1, n2) {
                var x = n1 / n2 * 100;
                return x.toFixed(1).toString() + '%' + ' = ' + n1.toString() + ' / ' + n2.toString();
            }(num_qualified_eff_distu, num_eff_distu)
        });
        tabulate("abstract-table", g_abstract_data, ["省调合格率（仅有效扰动）", "参考合格率（所有扰动）"]);

        //For detail information
        g_columns = ["#id", '考核结果',
            '免考核', '扰动类型',
            '开始时刻',
            '时长', '实际积分电量', '理论积分电量', '贡献比', '前十秒平均功率', '极限频率'];

        //Save only detail table columns for local files.
        g_file_content.shift();
        g_file_content.shift();
        g_file_content.push(g_columns);

        //display the detail table on the web pages.
        tabulate("detail-table", g_data, g_columns);

        console.log("PMU check results end.");
    });
}
