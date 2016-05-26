//Global variables in the page.
var g_data = [];  //array for data from the figure
var margin = {top: 20, right: 20, bottom: 30, left: 50};

//Set current date
function SetCurrentLastTenMinutesInterval(){
    document.getElementById("StartTime").value = GetLastTenMinutesTimestamp();
    document.getElementById("EndTime").value = GetCurrentTimestamp();
}
//Load data from DB and draw the data on the screen.
function LoadCurve() {

    //clear the old drawing.
    g_data = [];
    var response_data = [];

    console.log("The number of path is: " + d3.select("svg").size());

    //configure the canvas for the drawing, parameters from html page.
    var width = document.getElementById("CanvasWidth").value - margin.left - margin.right;
    var height = document.getElementById("CanvasHeight").value - margin.top - margin.bottom;

    var start = document.getElementById("StartTime").value;
    var end = document.getElementById("EndTime").value;

    var ip_addr = document.getElementById("DBIPAddress").value;
    var table = document.getElementById("DBTableName").value;

    var x_name = document.getElementById("XAxialFieldName").value;

    //y_name
    var radios = document.getElementsByName('YAxialFieldName');
    var y_name = "power_001";
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

    //split a larger time interval into several smaller ones.
    var interval = [];
    var t = d3.time.minutes(start_time, end_time, 60);
    if (start_time < t[0] || 0 == t.length) {
        interval.push(start_time);
    }
    interval = interval.concat(t);
    interval.push(end_time);

// for D3.JS configuration
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
    d3.select("#canvas").append("hr")

    //figure information
    d3.select("#canvas").append("h5").text(y_name.toUpperCase() + ' from ' + start + ' to ' + end);
    var svg = d3.select("#canvas").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //only for frequency figures
    freq_line_bottom_offset = (y_abnormal_bottom_value - y_minimum) / (y_maximum - y_minimum);
    freq_line_above_offset = 1 - (y_maximum - y_abnormal_top_value) / (y_maximum - y_minimum);
    if ('freq' == y_name.substr(0, 4)) {
        svg.append("linearGradient")
            .attr("id", "freq-line-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", y(y_minimum))
            .attr("x2", 0).attr("y2", y(y_maximum))
            .selectAll("stop")
            .data([
                {offset: "0%", color: "red"},
                {offset: freq_line_bottom_offset, color: "red"},
                {offset: freq_line_bottom_offset, color: "steelblue"},
                {offset: freq_line_above_offset, color: "steelblue"},
                {offset: freq_line_above_offset, color: "red"},
                {offset: "100%", color: "red"}
            ])
            .enter().append("stop")
            .attr("offset", function (d) {
                return d.offset;
            })
            .attr("stop-color", function (d) {
                return d.color;
            });
    }

    //Create X axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    //Create Y axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    //judge the figure is frequency line or power line
    if ('freq' == y_name.substr(0, 4)) {
        svg.append("path")
            .datum(g_data)
            .attr("class", "freq-line")
            .attr("d", line);
    } else {
        svg.append("path")
            .datum(g_data)
            .attr("class", "line")
            .attr("d", line);
    }

    //data slice index for smaller time interval.
    var index = Array.apply(null, Array(interval.length - 1)).map(function (_, i) {
        return i;
    });

    var data_slice = new Array(interval.length - 1);

    index.forEach(function (i) {
        var k = i;
        var json_request_sql = " SELECT "
            + " to_char(packet_time, 'IYYY-MM-DD HH24:MI:SS') as packet_time "
            + " , " + y_name
            + " FROM " + table
            + " WHERE "
            + x_name + ">" + "'" + ConvertDate2String(interval[k]) + "'"
            + " AND "
            + x_name + "<" + "'" + ConvertDate2String(interval[k + 1]) + "'"
            + " ";

        var http_req = 'http://' + ip_addr + '/select?' + encode(json_request_sql);

        console.log("The [" + k + "th] Data are taking from DB for drawing.");

        d3.json(http_req, function (json) {

            if ('string' == typeof json) {
                alert("返回结果不正确！\n输入参数可能有误，请修正后重试。\n" + json);
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
            g_data = [];
            data_slice.forEach(function (d) {
                d.forEach(function (d) {
                    g_data.push(d)
                });
            });

            //Update the Y axis only for power, fixed only for frequency
            if ('powe' == y_name.substr(0, 4)) {
                y.domain(d3.extent(g_data, function (d) {
                    return d['yValue'];
                }));
            }

            svg.selectAll(".y.axis")
                .transition()
                .attr("class", "y axis")
                .call(yAxis);

            if ('freq' == y_name.substr(0, 4)) {
                svg.selectAll(".freq-line")
                    .datum(g_data)
                    .attr("d", line);
            } else {
                svg.selectAll(".line")
                    .datum(g_data)
                    .attr("d", line);

            }
// mouse over and display Y-values
            var focus = svg.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("circle")
                .attr("r", 5)
                .attr("fill", "red");

            focus.append("text")
                .attr("x", 9)
                .attr("dy", ".35em");

            svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .on("mouseover", function () {
                    focus.style("display", null);
                })
                .on("mouseout", function () {
                    focus.style("display", "none");
                })
                .on("mousemove", mousemove);

            bisectDate = d3.bisector(function (d) {
                return d.xValue;
            }).left;

            function mousemove() {
                x0 = x.invert(d3.mouse(this)[0]);
                var i = bisectDate(g_data, x0, 1),
                    d0 = g_data[i - 1],
                    d1 = g_data[i],
                    d = x0 - d0.xValue > d1.xValue - x0 ? d1 : d0;
                focus.attr("transform", "translate(" + x(d.xValue) + "," + y(d.yValue) + ")");
                focus.select("text").text(d.yValue);
            }

            console.log("The [" + k + "th ] drawing ends.");
        });
    });

    //scroll down the bottom of pages.
    document.getElementById('bottom').scrollIntoView();
}
