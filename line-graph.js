/*jslint browser for white */

var lineGraph = function (canvasGraph) {
    "use strict";
    var canvas = canvasGraph;
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;

    var draw = function (graph) {
        if (checkGraphConfig(graph))
            drawLineGraph(graph);
    };

    var checkGraphConfig = function (graph) {
        if (graph && graph.record && graph.record.length) {
            checkOptions(graph);
            return true;
        } else {
            return false;
        }
    };

    var checkOptions = function (graph) {
        validateDimensions(graph);
        validateColors(graph);
        validateNames(graph);
    };

    var validateDimensions = function (graph) {
        if (!validHeight(graph.height))
            graph.height = {
                min: 0,
                max: 1.0
            };

        if (!(graph.height.shadow <= graph.height.min))
            graph.height.shadow = graph.height.min;

        if (!validInterval(graph.x))
            graph.x = {
                start: 0,
                end: 1.0
            };
    };

    var validateColors = function (graph) {
        if (!(graph.color && graph.color.stroke && graph.color.shadow))
            graph.color = {
                stroke: "rgb(0, 0, 255)",
                shadow: "rgba(0, 100, 255, 0.15)"
            };

        if (graph.xAxis && typeof graph.color.axis !== 'string')
            graph.color.axis = "black";
    };

    var validHeight = function (height) {
        return height && height.min >= 0 && height.max <= 1.0 &&
            height.max > height.min;
    };

    var validInterval = function (interval) {
        return interval && interval.end > interval.start;
    };

    var validateNames = function (graph) {
        if (!validName(graph.title))
            graph.title = "unnamed graph";
    };

    var validName = function (name) {
        return typeof name === 'string';
    };

    var clear = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
    };

    var drawGrid = function () {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgb(200, 200, 200)";
        const tenthWidth = canvas.width / 10;
        const tenthHeight = canvas.height / 10;

        for (let i = 1; i < 10; i += 1) {
            drawVerticalLine(i * tenthWidth);
            drawHorizontalLine(i * tenthHeight);
        }
    };

    var drawVerticalLine = function (x) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    };

    var drawHorizontalLine = function (y) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    };

    var drawLineGraph = function (graph) {
        setupLines(graph.color);
        var yMaxMin = maxMin(graph.record);
        drawCurve(graph, yMaxMin);
        drawCurveShadow(graph);

        if (graph.xAxis)
            drawXAxis(graph, yMaxMin);
    };

    var maxMin = function (array) {
        var max = array[0];
        var min = array[0];
        var length = array.length;

        for (let i = 1; i < length; i += 1) {
            if (array[i] > max)
                max = array[i];
            else if (array[i] < min)
                min = array[i]
        }

        return {
            min: min,
            max: max
        };
    };

    var setupLines = function (color) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color.stroke;
        ctx.fillStyle = color.shadow;
    };

    var drawCurve = function (graph, yMaxMin) {
        if (yMaxMin.max - yMaxMin.min === 0)
            drawConstantLine(graph);
        else
            drawLines(graph, yMaxMin);
    };

    var drawConstantLine = function (graph) {
        if (graph.record[0])
            var constHeight = height -
                height * (graph.height.max + graph.height.min) / 2;
        else
            var constHeight = height - graph.height.min * height;
        drawHorizontalLine(constHeight);
    };

    var drawLines = function (graph, yMaxMin) {
        var length = graph.record.length;
        var xStep = canvas.width / (length - 1);
        var yStep = (graph.height.max - graph.height.min) * height /
            (yMaxMin.max - yMaxMin.min);
        var yOffset = height - graph.height.min * height;
        ctx.moveTo(0, yOffset - (graph.record[0] - yMaxMin.min) * yStep);

        for (let i = 1; i < length; i += 1)
            ctx.lineTo(i * xStep,
                yOffset - (graph.record[i] - yMaxMin.min) * yStep);

        ctx.stroke();
    };

    var drawCurveShadow = function (graph) {
        var bottom = height - graph.height.shadow * height;
        ctx.lineTo(width, bottom);
        ctx.lineTo(0, bottom);
        ctx.closePath();
        ctx.fill();
    };

    var drawXAxis = function (graph, yMaxMin) {
        ctx.beginPath();
        ctx.strokeStyle = graph.color.axis;

        var xHeight = getXAxisHeight(graph, yMaxMin);
        ctx.moveTo(0, xHeight);
        ctx.lineTo(width, xHeight);
        ctx.stroke();
    };

    var getXAxisHeight = function (graph, yMaxMin) {
        var yDiff = yMaxMin.max - yMaxMin.min;

        if (yDiff) {
            var yStep = (graph.height.max - graph.height.min) * height / yDiff;
            var yOffset = height - graph.height.min * height;
            return yOffset - (0 - yMaxMin.min) * yStep;
        } else {
            return height - graph.height.min * height;
        }
    }

    drawGrid();
    return {
        draw: draw,
        clear: clear
    };
}