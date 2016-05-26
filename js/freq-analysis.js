//Global variables in the page.
var data = [];
var margin = {top: 20, right: 20, bottom: 30, left: 50};

function LoadFreqCurve() {

    if (d3.select("svg").size() > 0) {
        d3.select("svg").remove();
    }
    data = [];

    var response_data = [];

    //clear the old drawing.
    console.log("The number of path is: " + d3.select("svg").size());

    /*    if (d3.select("path").size() > 0) {
     d3.select("path").remove();
     }*/

    //configure the canvas for the drawing
    var width = document.getElementById("CanvasWidth").value - margin.left - margin.right;
    var height = document.getElementById("CanvasHeight").value - margin.top - margin.bottom;

    var start = document.getElementById("StartTime").value;
    var end = document.getElementById("EndTime").value;

    var ip_addr = document.getElementById("DBIPAddress").value;
    var table = document.getElementById("DBTableName").value;

    var x_name = document.getElementById("XAxialFieldName").value;
//    var y_name = document.getElementById("YAxialFieldName").value;

    var radios = document.getElementsByName('YAxialFieldName');
    var y_name = "frequency_001";
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].type === 'radio' && radios[i].checked) {
            // get value, set checked flag or do whatever you need to
            y_name = radios[i].value;
        }
    }

    var y_minimum = document.getElementById("YAxialBottomLimit").value;
    var y_maximum = document.getElementById("YAxialTopLimit").value;
    var y_abnormal_top_value = document.getElementById("YAxialIntervalTopLimit").value;
    var y_abnormal_bottom_value = document.getElementById("YAxialIntervalBottomLimit").value;

    // start timestamp and end timestamp
    var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;
    var time_format = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
    var ConvertDate2String = d3.time.format("%Y-%m-%d %H:%M:%S");

    start_time = time_format(start);
    end_time = time_format(end);

    var interval = [];

    var t = d3.time.minutes(start_time, end_time, 60);
    if (start_time < t[0] || 0 == t.length) {
        interval.push(start_time);
    }
    interval = interval.concat(t);

    interval.push(end_time);


    var x = d3.time.scale()
        .domain([start_time, end_time])
        .range([0, width]);
    var y = d3.scale.linear()
        .domain([y_minimum, y_maximum])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    var line = d3.svg.line()
        .x(function (d) {
            return x(d.xValue);
        })
        .y(function (d) {
            return y(d.yValue);
        });

    //Canvas for plot
    var svg = d3.select("#canvas").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Create X axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    //Create Y axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("clipPath")
        .attr("id", "clip-above")
        .append("rect")
        .attr("width", width)
        .attr("height", y(y_abnormal_top_value));
    svg.append("clipPath")
        .attr("id", "clip-middle")
        .append("rect")
        .attr("width", width)
        .attr("y", y(y_abnormal_top_value))
        .attr("height", y(y_abnormal_top_value - y_abnormal_bottom_value));
    svg.append("clipPath")
        .attr("id", "clip-below")
        .append("rect")
        .attr("y", y(y_abnormal_bottom_value))
        .attr("width", width)
        .attr("height", height - y(y_abnormal_bottom_value));

    var index = Array.apply(null, Array(interval.length - 1)).map(function (_, i) {
        return i;
    });

    var data_slice = new Array(interval.length - 1);

    index.forEach(function (i) {
        var k = i;
        var json_request = " SELECT "
            + " to_char(packet_time, 'IYYY-MM-DD HH24:MI:SS') as packet_time "
            + " , " + y_name
            + " FROM " + table
            + " WHERE "
            + x_name + ">" + "'" + ConvertDate2String(interval[k]) + "'"
            + " AND "
            + x_name + "<" + "'" + ConvertDate2String(interval[k + 1]) + "'"
            + " "

        var http_req = 'http://' + ip_addr + '/select?' + encode(json_request);

        console.log("The [" + k + "th] Data are taking from DB for drawing.");

        d3.json(http_req, function (json) {

            if ('string' == typeof json) {
                alert("输入参数有误！请修正后重试！\n" + json);
                return;
            }


            var json_data = [];
            response_data = json.rows;
            console.log("The [" + i + "th] data length is: " + response_data.length);
            response_data.forEach(function (d) {
                json_data.push({
                    'xValue': time_format(d[x_name]),
                    'yValue': +d[y_name]
                });
            });

            data_slice[k] = json_data;

            //Clear Update data
            data = [];
            data_slice.forEach(function (d) {
                d.forEach(function (d) {
                    data.push(d)
                });
            });

            if (d3.select(".line").size() > 0) {
                d3.selectAll(".line").remove();
            }
            svg.selectAll(".line")
                .data(["above", "middle", "below"])
                .enter()
                .append("path")
                .attr("class", function (d) {
                    return "line " + d;
                })
                .attr("clip-path", function (d) {
                    return "url(#clip-" + d + ")";
                })
                .datum(data)
                .attr("d", line);

            console.log("The [" + k + "th ] drawing ends.");
        });
    });
}


function MarkCurve() {

    /*   if (d3.select("path").size() > 0) {
     d3.select("path").remove();
     }*/

    var data_count = 0;

    var width = document.getElementById("CanvasWidth").value - margin.left - margin.right;
    var height = document.getElementById("CanvasHeight").value - margin.top - margin.bottom;

    var start = document.getElementById("StartTime").value;
    var end = document.getElementById("EndTime").value;

    var y_minimum = document.getElementById("YAxialBottomLimit").value;
    var y_maximum = document.getElementById("YAxialTopLimit").value;
    var y_abnormal_top_value = document.getElementById("YAxialIntervalTopLimit").value;
    var y_abnormal_bottom_value = document.getElementById("YAxialIntervalBottomLimit").value;

    var time_format = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    start_time = time_format(start);
    end_time = time_format(end);

    var x = d3.time.scale()
        .domain([start_time, end_time])
        .range([0, width]);
    var y = d3.scale.linear()
        .domain([y_minimum, y_maximum])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    var line = d3.svg.line()
        .x(function (d) {
            return x(d.xValue);
        })
        .y(function (d) {
            return y(d.yValue);
        });

    //Canvas for plot
    var svg = d3.select("svg");
    svg.select("clipPath")
        .attr("id", "clip-above")
        .append("rect")
        .attr("width", width)
        .attr("height", y(y_abnormal_top_value));
    svg.append("clipPath")
        .attr("id", "clip-middle")
        .append("rect")
        .attr("width", width)
        .attr("y", y(y_abnormal_top_value))
        .attr("height", y(y_abnormal_top_value - y_abnormal_bottom_value));
    svg.append("clipPath")
        .attr("id", "clip-below")
        .append("rect")
        .attr("y", y(y_abnormal_bottom_value))
        .attr("width", width)
        .attr("height", height - y(y_abnormal_bottom_value));

    svg.selectAll(".line")
        .data(["above", "middle", "below"])
        .attr("class", function (d) {
            return "line " + d;
        })
        .attr("clip-path", function (d) {
            return "url(#clip-" + d + ")";
        })
        .datum(data)
        .attr("d", line);
}
