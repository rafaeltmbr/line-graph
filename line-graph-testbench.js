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
            name: "Testbench Graph",
            color: "darkgreen",
            font: "large sans-serif"
        },
        xAxis: {
            values: ["12:30", "13:00", "13:30"],
            color: "black",
            font: "medium sans-serif"
        },
        yAxis: {
            font: "medium sans-serif"
        }
    };

    var sin = {
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
            precision: 2
        },
        xAxis: true
    }

    var cube = {
        record: [],
        height: {
            min: 0.60,
            max: 1.0
        },
        color: {
            stroke: "rgb(0, 0, 255)",
            shadow: "rgba(0, 120, 255, 0.2)"
        },
        yAxis: {
            lines: 5
        }
    }

    fillArrayCoordinates(sin.record, 100, (i) => Math.sin(0.0635 * i));
    fillArrayCoordinates(cube.record, 100, (i) => i ** 2);

    graph.setConfig(graphConfig)
    graph.draw(cube);
    graph.draw(sin);
};

testbench();