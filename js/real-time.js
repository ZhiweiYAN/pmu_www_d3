/**
 * Created by qingle on 13-11-24.
 */
var data = [], count = 0;
var x_count = 0;
var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S").parse;

function DynamicLoad() {
    setTimeout(load, 1000);
}


function load() {
    console.log("loading is running!");

    var start = document.getElementById("StartTime").value;
    var end = document.getElementById("EndTime").value;
    var table = document.getElementById("DBTableName").value;
    var time = document.getElementById("X-AxialFieldName").value;
    var value = document.getElementById("Y-AxialFieldName").value;
    data = [];
    d3.json('http://192.168.1.102:8888/select?qs=' + start + '&js=' + end + '&bm=' + table + '&shijian=' + time + '&shuju=' + value, function (json) {

        var data1 = json.rows;
        console.log(data1.length);
        x_count = data1.length;
        data1.forEach(function (d) {
            data.push({
                'value': +d.frequency_001,
                'time': parseDate(d.packet_time)
            });
        });
        chartInit();
    });
}

function IsNum(s) {
    if (s != null && s != "") {
        return !isNaN(s);
    }
    return false;
}

function chartInit() {
    if (IsNum(document.getElementById("myWidth").value) && IsNum(document.getElementById("myHeight").value)) {
        var margin = {top: 21, right: 20, bottom: 30, left: 40},
            width = document.getElementById("myWidth").value - margin.left - margin.right,
            height = document.getElementById("myHeight").value - margin.top - margin.bottom;
        var minvalue = document.getElementById("myMinValue").value;
        var maxvalue = document.getElementById("myMaxValue").value;
    }

    var x = d3.scale.linear()
        .domain([0, x_count])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([minvalue, maxvalue])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(20)
        .tickSize(-height);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10)
        .tickSize(-width);
    var svg;

    console.log(d3.select("svg").size())

    if (d3.select("svg").size() > 0) {
        d3.select("svg").remove();
    }

    svg = d3.select("#foo").append("svg")
        .attr("width", width + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.selectAll("path").remove();

    var lineFunction = d3.svg.line()
        .x(function (d, i) {
            return x(i);
        })
        .y(function (d) {
            return y(d.value);
        })
        .interpolate("linear");

    svg.append("path")
        .attr("d", lineFunction(data))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    setTimeout(DynamicLoad, 2);

}
