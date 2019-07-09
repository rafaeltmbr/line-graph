/*jslint browser for white */

"use strict";

var testbench = function () {
    var graph = {};
    var canvas = document.getElementById("canvas");

    var updateGraph = function (e) {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        graph = lineGraph(canvas, convertHour);
        graph.setConfig(graphConfig);
        graph.clear();
        graph.draw(temperature);
        graph.draw(pressure);
    };

    var convertHour = function (x) {
        var now = new Date();
        var xSeconds = 60 - Math.round( 60 * x );
        var xTime = new Date(now.getTime() - xSeconds * 1000);
        var xFormat = xTime.getHours() + ":" + xTime.getMinutes() + ":"
            + xTime.getSeconds();
        return xFormat;
    };
    
    var graphConfig = {
        title: {
            name: "Line Graph Testbench",
            color: "darkgreen",
            font: "large sans-serif"
        },
        xAxis: {
            values: [],
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
            min: 0.05,
            max: 0.45
        },
        color: {
            stroke: "rgb(150, 0, 150)",
            shadow: "rgba(150, 0, 150, 0.2)"
        },
        yAxis: {
            lines: 3,
            precision: 1,
            title: "Temperature [°C]",
            verticalTitle: true
        },
        xAxis: {
            visible: true,
            color: "red",
            width: 1
        }
    };

    var pressure = {
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
            lines: 5,
            title: "Pressure [psig]",
            verticalTitle: true
        },
        xAxis: {
            visible: true
        },
        range: {
            fixed: true,
            min: 0,
            max: 45
        }
    };
    
    var mouseHandler = function (e) {
        graph.clear();
        graph.draw(temperature, e.offsetX, e.offsetY);
        graph.draw(pressure, e.offsetX, e.offsetY);
    };
    
    var updateGraphTime = function() {
        var now = new Date();
        var prev = new Date(now.getTime() - 60000);
        var nowFormat = now.getHours() + ":" + now.getMinutes() + ":"
            + now.getSeconds();
            var prevFormat = prev.getHours() + ":" + prev.getMinutes() + ":"
            + prev.getSeconds();
            
        graphConfig.xAxis.values = [prevFormat, "Time", nowFormat];
        
        temperature.record.shift();
        temperature.record.push(temperatureAverage.avg);
        pressure.record.shift();
        pressure.record.push(pressureAverage.avg);

        graph.clear();
        graph.setConfig(graphConfig);
        graph.draw(temperature);
        graph.draw(pressure);
        
        setTimeout(updateGraphTime, 50);
    };
    
    var updateAverage = function(avg, min, max) {
        var newest = Math.random() * (max - min) + min;
        var oldest = avg.shift();
        avg.push(newest);
        avg.total -= oldest;
        avg.total += newest;
        avg.avg = avg.total / avg.length;
    };

    var autoUpdateAverage = function() {
        updateAverage(temperatureAverage, -20, 20);
        updateAverage(pressureAverage, 5, 45);
        setTimeout(autoUpdateAverage, 50);
    };
    
    var temperatureAverage = [], pressureAverage = [];
    temperatureAverage.total = pressureAverage.total = 0;
    temperatureAverage.avg = pressureAverage.avg = 0;
    for (let i=0; i < 100; i++) {
        temperature.record.push(0);
        temperatureAverage.push(0);
        pressure.record.push(0);
        pressureAverage.push(0);
    }

    for (let i=0; i < 100; i++) {
        updateAverage(temperatureAverage, -20, 20);
        updateAverage(pressureAverage, 0, 40);
    }

    updateGraph();
    updateGraphTime();
    autoUpdateAverage();

    window.addEventListener("resize", updateGraph);
    canvas.addEventListener("mousemove", mouseHandler);
};

testbench();