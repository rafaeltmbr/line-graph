/*jslint browser for white */

"use strict";

var fillArrayCoordinates = function (array, count, func) {
    for (let i = 0; i < count; i += 1)
        array.push(func(i));
};

var testbench = function () {
    var canvas = document.getElementById("canvas");
    var graph = lineGraph(canvas);

    var graphConfig = {
        title: {
            name: "Line Graph Testbench",
            color: "darkgreen",
            font: "large sans-serif"
        },
        xAxis: {
            values: ["12:30", "13:00", "13:30"],
            textColor: "brown",
            font: "medium sans-serif"
        },
        yAxis: {
            font: "medium sans-serif"
        }
    };

    var temperature = {
        record: [],
        height: {
            min: 0.0,
            max: 0.40
        },
        color: {
            stroke: "rgb(150, 0, 150)",
            shadow: "rgba(150, 0, 150, 0.2)",
            axis: "gray"
        },
        yAxis: {
            lines: 3,
            precision: 2,
            title: "Temperature [°C]",
            verticalTitle: true
        },
        xAxis: {
            
        }
    }

    var pressure = {
        record: [],
        height: {
            min: 0.60,
            max: 1.0
        },
        color: {
            stroke: "rgb(0, 0, 255)",
            shadow: "rgba(0, 120, 255, 0.2)",
            axis: "black"
        },
        yAxis: {
            lines: 5,
            title: "Pressure [psig]",
            verticalTitle: true
        },
        xAxis: {

        }
    }

    fillArrayCoordinates(temperature.record, 100, (i) => Math.sin(0.0635 * i) * 3 + 5);
    fillArrayCoordinates(pressure.record, 100, (i) => Math.sqrt(i) * 4);

    graph.setConfig(graphConfig);
    graph.clear();
    graph.draw(temperature);
    graph.draw(pressure);
};

testbench();