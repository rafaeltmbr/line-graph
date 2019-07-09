/*jslint browser for white */

var lineGraph = function (canvasGraph, xAxisValueCallback) {
    "use strict";
    var canvas = canvasGraph;
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    var xCallback = xAxisValueCallback;
    var cfg = {
        title: {
            name: "",
            color: "black",
            font: "medium sans-serif"
        },
        xAxis: {
            values: [],
            textColor: "black",
            font: "small sans-serif"
        },
        yAxis: {
            font: "small sans-serif"
        },
        gw: width * 0.8,
        gwoff: (width - width * 0.8) * 0.75,
        gh: height * 0.7,
        ghoff: (height - height * 0.7) / 2,
        pointRadius: 5
    };

    const drawDefault = {
        record: [],
        height: {
            min: 0.0,
            max: 1.0
        },
        color: {
            stroke: "rgb(0, 0, 255)",
            shadow: "rgba(0, 100, 255, 0.15)",
            axis: "black"
        },
        yAxis: {
            lines: 2,
            precision: 0,
            title: "",
            verticalTitle: false
        },
        xAxis: {

        }
    };

    var graph = {};
    var yMaxMin = {};
    var pointLine = {
        x: -1,
        y: -1,
        visible: false
    }

    var draw = function (userConfig, mouseOverX = -1, mouseOverY = -1) {
        ctx.save();

        setupGraph(userConfig);
        yMaxMin = maxMin(graph.record);
        drawGraph();
        drawMarkPoint(mouseOverX, mouseOverY);

        ctx.restore();
    };

    var setConfig = function (config) {
        Object.assign(cfg, config);
    };

    var clear = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        pointLine.visible = false;
    };

    var setupGraph = function (userConfig) {
        graph = {};
        Object.assign(graph, drawDefault);
        Object.assign(graph, userConfig);
    };

    var drawGraph = function () {
        drawLineGraph();
        drawText();
    };

    var drawGrid = function () {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgb(200, 200, 200)";

        for (let i = 1; i < 10; i += 1) {
            drawVerticalLine(cfg.gwoff + i * cfg.gw / 10, cfg.ghoff, cfg.gh + cfg.ghoff);
            drawHorizontalLine(cfg.ghoff + i * cfg.gh / 10, cfg.gwoff, cfg.gw + cfg.gwoff);
        }
        drawEdges();
    };

    var drawEdges = function () {
        ctx.strokeStyle = "black";
        drawVerticalLine(cfg.gwoff, cfg.ghoff, cfg.gh + cfg.ghoff);
        drawHorizontalLine(cfg.ghoff, cfg.gwoff, cfg.gw + cfg.gwoff);
        drawVerticalLine(cfg.gwoff + 10 * cfg.gw / 10, cfg.ghoff, cfg.gh + cfg.ghoff);
        drawHorizontalLine(cfg.ghoff + 10 * cfg.gh / 10, cfg.gwoff, cfg.gw + cfg.gwoff);
    };

    var drawVerticalLine = function (x, y1 = 0, y2 = height) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
    };

    var drawHorizontalLine = function (y, x1 = 0, x2 = width) {
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
    };

    var drawLineGraph = function () {
        setupLines(graph.color);
        drawCurve();
        drawCurveShadow();

        if (graph.xAxis)
            drawXAxis();
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

    var drawCurve = function () {
        if (yMaxMin.max - yMaxMin.min === 0)
            drawConstantLine(graph);
        else
            drawLines();
    };

    var drawConstantLine = function () {
        if (graph.record[0] >= 0) {
            var constHeight = cfg.gh + cfg.ghoff -
                cfg.gh * (graph.height.max + graph.height.min) / 2;
        } else {
            var constHeight = cfg.gh - graph.height.min * cfg.gh + cfg.ghoff;
        }
        drawHorizontalLine(constHeight, cfg.gwoff, cfg.gw + cfg.gwoff);
    };

    var drawLines = function () {
        var length = graph.record.length;
        var xStep = cfg.gw / (length - 1);
        var yStep = (graph.height.max - graph.height.min) * cfg.gh /
            (yMaxMin.max - yMaxMin.min);
        var yOffset = cfg.gh - graph.height.min * cfg.gh + cfg.ghoff;
        ctx.moveTo(cfg.gwoff, yOffset - (graph.record[0] - yMaxMin.min) * yStep);

        for (let i = 1; i < length; i += 1)
            ctx.lineTo(i * xStep + cfg.gwoff,
                yOffset - (graph.record[i] - yMaxMin.min) * yStep);

        ctx.stroke();
    };

    var drawCurveShadow = function () {
        var constantValue = yMaxMin.max - yMaxMin.min === 0;
        var bottom = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
        if (constantValue && yMaxMin.max <= 0)
            bottom = bottom - cfg.gh * (graph.height.max - graph.height.min) / 2;

        ctx.lineTo(cfg.gw + cfg.gwoff, bottom);
        ctx.lineTo(cfg.gwoff, bottom);
        ctx.closePath();
        ctx.fill();
    };

    var drawXAxis = function () {
        ctx.beginPath();
        ctx.strokeStyle = graph.color.axis;

        var xHeight = getXAxisHeight();
        if(xHeight <= cfg.gh + cfg.ghoff) {
            ctx.moveTo(cfg.gwoff, xHeight);
            ctx.lineTo(cfg.gw + cfg.gwoff, xHeight);
            ctx.stroke();
        }
    };

    var getXAxisHeight = function () {
        var yDiff = yMaxMin.max - yMaxMin.min;
        var hDiff = (graph.height.max - graph.height.min) * cfg.gh;
        var offset = (yMaxMin.max > 0 ? 0 : -hDiff / 2);

        if (yDiff) {
            var yStep = hDiff / yDiff;
            var yOffset = cfg.gh - graph.height.min * cfg.gh + cfg.ghoff;
            return yOffset + yMaxMin.min * yStep;
        } else {
            return cfg.gh + cfg.ghoff - cfg.gh * graph.height.min + offset;
        }
    };

    var drawText = function () {
        ctx.textAlign = "center";
        drawTitle();
        drawXText();
        drawYText();
    };

    var drawTitle = function () {
        ctx.textBaseline = "bottom";
        ctx.font = cfg.title.font;
        ctx.fillStyle = cfg.title.color;
        ctx.fillText(cfg.title.name, cfg.gw / 2 + cfg.gwoff, cfg.ghoff * 0.75);
    };

    var drawXText = function () {
        ctx.textBaseline = "top";
        ctx.font = cfg.xAxis.font;
        ctx.fillStyle = cfg.xAxis.textColor;
        var steps = cfg.xAxis.values.length;
        var space = cfg.gw / (steps - 1);

        for (let i = 0; i < steps; i += 1)
            ctx.fillText(cfg.xAxis.values[i] + "", cfg.gwoff + space * i,
                cfg.gh + cfg.ghoff * 1.4);
    };

    var drawYText = function () {
        if (graph.yAxis.lines < 2)
            return;

        setupYText();
        var lim = getFormattedLimit(yMaxMin)
        var diff = lim.max - lim.min;
        var valueStep = diff / (graph.yAxis.lines - 1);
        var yOffset = cfg.gh - graph.height.min * cfg.gh + cfg.ghoff;
        var yStep = (graph.height.max - graph.height.min) /
            (graph.yAxis.lines - 1) * cfg.gh;

        if (diff)
            drawVariableYText(valueStep, lim, yOffset, yStep);
        else
            drawConstantYText(lim.min, yOffset);

        drawYTitle();
    };

    var setupYText = function () {
        ctx.fillStyle = graph.color.stroke;
        ctx.font = cfg.yAxis.font;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
    };

    var getFormattedLimit = function (lim) {
        return {
            min: formatMin(lim.min),
            max: formatMax(lim.max)
        };
    };

    var drawVariableYText = function (valueStep, limits, yOffset, yStep) {
        for (let i = 0; i < graph.yAxis.lines; i += 1)
            ctx.fillText((valueStep * i + limits.min).toFixed(graph.yAxis.precision),
                cfg.gwoff * 0.9, yOffset - yStep * i);
    };

    var drawConstantYText = function (value) {
        var lineLow = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
        var lineHigh = lineLow - cfg.gh * (graph.height.max - graph.height.min) / 2;
        var lineZero = (value > 0 ? lineLow : lineHigh);
        var lineConst = (value >= 0 ? lineHigh : lineLow);

        ctx.fillText(value.toFixed(graph.yAxis.precision), cfg.gwoff * 0.9, lineConst);

        if (graph.xAxis)
            ctx.fillText('0', cfg.gwoff * 0.9, lineZero);
    };

    var drawYTitle = function () {
        ctx.save();
        ctx.textAlign = "center";

        var horizontalHeight = cfg.gh + cfg.ghoff - cfg.gh * graph.height.max;
        var verticalHeight = horizontalHeight +
            (graph.height.max - graph.height.min) / 2 * cfg.gh;

        if (graph.yAxis.verticalTitle) {
            ctx.translate(cfg.gwoff * 0.2, verticalHeight);
            ctx.rotate(Math.PI * 1.5);
            ctx.fillText(graph.yAxis.title, 0, 0);
        } else {
            ctx.fillText(graph.yAxis.title, cfg.gwoff / 2, horizontalHeight - cfg.ghoff / 2);
        }

        ctx.restore();
    };

    var formatMin = function (min) {
        if (min > 10)
            return formatGraterThan10(min, Math.floor);
        else if (min < 0)
            return formatLessThan0(min, Math.floor);
        else
            return Math.floor(min);
    };

    var formatMax = function (max) {
        if (max > 10)
            return formatGraterThan10(max, Math.ceil);
        else if (max < 0)
            return formatLessThan0(max, Math.ceil);
        else
            return Math.ceil(max);
    };

    var formatGraterThan10 = function (n, round) {
        var offsetCount = 0;

        while (n > 10) {
            n /= 10;
            offsetCount += 1;
        }

        n = round(n);
        while (offsetCount > 0) {
            n *= 10;
            offsetCount -= 1;
        }

        return n;
    };

    var formatLessThan0 = function (n, round) {
        var offsetCount = 0;

        while (n < -10) {
            n *= 10;
            offsetCount += 1;
        }

        n = round(n);
        while (offsetCount > 0) {
            n /= 10;
            offsetCount -= 1;
        }

        return n;
    };

    var drawMarkPoint = function (x, y) {
        if (isPointOverGraph(x, y)) {
            var xoff = x - cfg.gwoff;
            var len = graph.record.length;
            var index = xoff * (graph.record.length-1) / cfg.gw;
            var indexL = Math.floor(index);
            var indexH = indexL + 1 >= len ? len-1 : indexL + 1;
            var recordL = graph.record[indexL];
            var recordH = graph.record[indexH];
            var record = (recordH - recordL) * (index - indexL) + recordL;
            var deltaY = (graph.height.max - graph.height.min) * cfg.gh /
                (yMaxMin.max - yMaxMin.min);
            var baseY = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
            var pointY = baseY - (record - yMaxMin.min) * deltaY;
            drawPointLine(x);
            drawPoint(x, pointY);
            drawYValue(record.toFixed(graph.yAxis.precision),
                x, pointY - 2 * cfg.pointRadius);
            drawXValue(xoff / cfg.gw);
        }
    };

    var isPointOverGraph = function (x, y) {
        return x >= cfg.gwoff && x < cfg.gw + cfg.gwoff &&
            y >= cfg.ghoff && y < cfg.gh + cfg.ghoff;
    };

    var drawPoint = function (x, y) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = graph.color.stroke;
        ctx.arc(x, y, cfg.pointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    var drawYValue = function(value, x, y) {
        ctx.save();
        ctx.beginPath();
        ctx.font = cfg.yAxis.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = graph.color.stroke;
        ctx.fillText(value + "", x, y);
        ctx.restore();
    };

    var drawPointLine = function(x) {
        if (pointLine.visible)
            return;
        pointLine.visible = true;

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgb(160, 160, 160)";
        drawVerticalLine(x, cfg.ghoff, cfg.gh + cfg.ghoff);
        ctx.restore();
    };

    var drawXValue = function (x) {
        if (!xCallback)
            return;

        ctx.save();
        ctx.beginPath();
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.font = cfg.xAxis.font;
        ctx.fillStyle = cfg.xAxis.textColor;
        var xValue = xCallback(x) + "";
        var xoff = cfg.gwoff + cfg.gw * x;
        var yoff = cfg.gh + cfg.ghoff * 1.1;
        ctx.fillText(xValue, xoff, yoff);
        ctx.restore();
    };

    drawGrid();
    return {
        draw: draw,
        clear: clear,
        setConfig: setConfig
    };
}