/*jslint browser for white */

"use strict";

var fillArrayCoordinates = function (array, count, func) {
    for (let i = 0; i < count; i += 1)
        array.push(func(i));
};

var testbench = function () {
    var canvas = document.getElementById("canvas");
    var graph = lineGraph(canvas);

    var sin = {
        record: [],
        height: {
            min: 0.0,
            max: 0.5
        },
        color: {
            stroke: "rgb(150, 0, 150)",
            shadow: "rgba(150, 0, 150, 0.2)",
            axis: "gray"
        },
        xAxis: true
    }

    var cube = {
        record: [],
        height: {
            min: 0.5,
            max: 1.0
        },
        color: {
            stroke: "rgb(0, 0, 255)",
            shadow: "rgba(0, 120, 255, 0.2)"
        }
    }

    fillArrayCoordinates(sin.record, 100, (i) => Math.sin(0.0635 * i));
    fillArrayCoordinates(cube.record, 100, (i) => i ** 3);

    graph.draw(cube);
    graph.draw(sin);
};

testbench();