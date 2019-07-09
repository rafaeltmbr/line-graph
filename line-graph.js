/*jslint browser for white */

Object.prototype.deepCopy = function deepCopyObject(target, source) {
    Object.keys(source).forEach(function (k) {
        if (source.hasOwnProperty(k)) {
            if (typeof source[k] === 'object' && !(source[k] instanceof Array)) {
                if (typeof target[k] === 'undefined') {
                    target[k] = {};
                }
                deepCopyObject(target[k], source[k]);
            } else {
                target[k] = source[k];
            }
        }
    });
};

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
            shadow: "rgba(0, 100, 255, 0.15)"
        },
        yAxis: {
            lines: 2,
            precision: 0,
            title: "",
            verticalTitle: false
        },
        xAxis: {
            visible: true,
            color: "black"
        },
        range: {
            fixed: false,
            min: 0,
            max: 100
        }
    };

    var graph = {};
    var yMaxMin = {};
    var pointLine = {
        visible: false
    };
    var cursor = {
        x: 0,
        y: 0
    };

    var draw = function (userConfig, mouseOverX, mouseOverY) {
        ctx.save();

        setupGraph(userConfig);
        yMaxMin = maxMin(graph.record);
        drawGraph();
        drawMarkPoint(mouseOverX, mouseOverY);

        ctx.restore();
    };

    var setupGraph = function (userConfig) {
        graph = {};
        Object.deepCopy(graph, drawDefault);
        Object.deepCopy(graph, userConfig);
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

    var drawGraph = function () {
        drawLineGraph();
        drawText();
    };

    var drawLineGraph = function () {
        setupLines(graph.color);
        drawCurve();
        drawCurveShadow();

        if (graph.xAxis.visible && (!graph.range.fixed || graph.range.min <= 0))
            drawXAxis();
    };

    var drawText = function () {
        ctx.textAlign = "center";
        drawTitle();
        drawXText();
        drawYText();
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

    var drawCurveShadow = function () {
        var constantValue = yMaxMin.max - yMaxMin.min === 0;
        var bottom = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
        var top = cfg.gh + cfg.ghoff - cfg.gh * graph.height.max;
        var xAxis = getXAxisHeight();

        if (xAxis > bottom)
            xAxis = bottom;
        else if (xAxis < top)
            xAxis = top;

        ctx.lineTo(cfg.gw + cfg.gwoff, xAxis);
        ctx.lineTo(cfg.gwoff, xAxis);
        ctx.closePath();
        ctx.fill();
    };

    var drawXAxis = function () {
        var yMax = cfg.gh + cfg.ghoff - cfg.gh * graph.height.max;
        var yMin = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
        var xHeight = getXAxisHeight();

        if (xHeight > yMin || xHeight < yMax)
            return;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = graph.xAxis.color;
        ctx.lineWidth = graph.xAxis.width;
        ctx.moveTo(cfg.gwoff, xHeight);
        ctx.lineTo(cfg.gw + cfg.gwoff, xHeight);
        ctx.stroke();
        ctx.restore();
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
        var lim = getFormattedLimit(graph.range.fixed ? graph.range : yMaxMin,
            graph.yAxis.precision);
        var diff = lim.max - lim.min;
        var valueStep = diff / (graph.yAxis.lines - 1);
        var yOffset = cfg.gh - graph.height.min * cfg.gh + cfg.ghoff;
        var yStep = (graph.height.max - graph.height.min) /
            (graph.yAxis.lines - 1) * cfg.gh;

        if (yMaxMin.max - yMaxMin.min)
            drawVariableYText(valueStep, lim, yOffset, yStep);
        else
            drawConstantYText(yMaxMin.max, yOffset);

        drawYTitle();
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
        if (graph.range.fixed)
            drawFixedRangeLines();
        else
            drawFreeRangeLines();
    };

    var drawFixedRangeLines = function () {
        var length = graph.record.length;
        var xStep = cfg.gw / (length - 1);
        var yOffset = cfg.gh + cfg.ghoff - graph.height.min * cfg.gh;
        var rangeDiff = graph.range.max - graph.range.min;
        var yStep = (graph.height.max - graph.height.min) * cfg.gh / rangeDiff;
        var yMax = yOffset - yStep * rangeDiff;
        var record0 = graph.record[0] > graph.range.max ? graph.range.max :
            graph.record[0] < graph.range.min ? graph.range.min :
            graph.record[0];

        ctx.moveTo(cfg.gwoff, yOffset - (record0 - graph.range.min) * yStep);
        for (let i = 1; i < length; i += 1) {
            var record = graph.record[i];
            if (record >= graph.range.min && record <= graph.range.max) {
                ctx.lineTo(i * xStep + cfg.gwoff,
                    yOffset - (record - graph.range.min) * yStep);
            } else {
                ctx.lineTo(i * xStep + cfg.gwoff,
                    (record > graph.range.max ? yMax : yOffset));
            }
        }

        ctx.stroke();
    };

    var drawFreeRangeLines = function () {
        var length = graph.record.length;
        var xStep = cfg.gw / (length - 1);
        var yOffset = cfg.gh - graph.height.min * cfg.gh + cfg.ghoff;
        var yStep = (graph.height.max - graph.height.min) * cfg.gh /
            (yMaxMin.max - yMaxMin.min);

        ctx.moveTo(cfg.gwoff, yOffset - (graph.record[0] - yMaxMin.min) * yStep);
        for (let i = 1; i < length; i += 1)
            ctx.lineTo(i * xStep + cfg.gwoff,
                yOffset - (graph.record[i] - yMaxMin.min) * yStep);

        ctx.stroke();
    };

    var getXAxisHeight = function () {
        var yMaxMinDiff = yMaxMin.max - yMaxMin.min;
        var yDiff = graph.range.fixed ? graph.range.max - graph.range.min :
            yMaxMinDiff;
        var min = graph.range.fixed ? graph.range.min : yMaxMin.min;
        var heightDiff = graph.height.max - graph.height.min;
        var deltaY = heightDiff * cfg.gh / yDiff;
        var bottomY = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
        var middleY = bottomY - cfg.gh * heightDiff / 2;

        if (yMaxMinDiff === 0) {
            if (yMaxMin.max < 0)
                return middleY;
            else
                return bottomY;
        }
        return bottomY + min * deltaY;
    };

    var drawHorizontalLine = function (y, x1 = 0, x2 = width) {
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
    };

    var drawVerticalLine = function (x, y1 = 0, y2 = height) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
    };

    var setupYText = function () {
        ctx.fillStyle = graph.color.stroke;
        ctx.font = cfg.yAxis.font;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
    };

    var getFormattedLimit = function (lim, precision) {
        var limMax = lim.max;
        var limMin = lim.min;

        for (let i = 0; i < precision; i += 1) {
            limMax *= 10;
            limMin *= 10;
        }

        limMax = Math.ceil(limMax);
        limMin = Math.floor(limMin);

        for (let i = 0; i < precision; i += 1) {
            limMax /= 10;
            limMin /= 10;
        }

        return {
            min: limMin,
            max: limMax
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

    var drawMarkPoint = function (x, y) {
        if (typeof x !== 'undefined' && typeof y !== 'undefined') {
            cursor.x = x;
            cursor.y = y;
        }
        if (isPointOverGraph(cursor.x, cursor.y))
            drawPointAndLine();
    };

    var drawPointAndLine = function () {
        var rangeDiff = graph.range.fixed ? graph.range.max - graph.range.min :
            yMaxMin.max - yMaxMin.min;
        var minValue = graph.range.fixed ? graph.range.min : yMaxMin.min;
        var xoff = cursor.x - cfg.gwoff;
        var len = graph.record.length;
        var index = xoff * (graph.record.length - 1) / cfg.gw;
        var indexL = Math.floor(index);
        var indexH = indexL + 1 >= len ? len - 1 : indexL + 1;
        var recordL = graph.record[indexL];
        var recordH = graph.record[indexH];
        var record = (recordH - recordL) * (index - indexL) + recordL;
        var deltaY = (graph.height.max - graph.height.min) * cfg.gh / rangeDiff;
        var baseY = cfg.gh + cfg.ghoff - cfg.gh * graph.height.min;
        var pointY = baseY - (record - minValue) * deltaY;
        var valueOffset = graph.xAxis.visible && record < 0 ? 4 : -4;
        var middleY = baseY - cfg.gh * (graph.height.max - graph.height.min) / 2;

        if (yMaxMin.max - yMaxMin.min === 0)
            pointY = record < 0 ? baseY : middleY;
        else if (graph.range.fixed) {
            if (record > graph.range.max)
                pointY = baseY - rangeDiff * deltaY;
            else if (record < graph.range.min)
                pointY = baseY;
        }

        drawPointLine(cursor.x);
        drawPoint(cursor.x, pointY);
        drawYValue(record.toFixed(graph.yAxis.precision),
            cursor.x, pointY + valueOffset * cfg.pointRadius);
        drawXValue(xoff / cfg.gw);
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

    var drawYValue = function (value, x, y) {
        ctx.save();
        ctx.beginPath();
        ctx.font = cfg.yAxis.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = graph.color.stroke;
        ctx.fillText(value + "", x, y);
        ctx.restore();
    };

    var drawPointLine = function (x) {
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

    var clear = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        pointLine.visible = false;
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

    var setConfig = function (config) {
        Object.assign(cfg, config);
    };

    drawGrid();
    return {
        draw: draw,
        clear: clear,
        setConfig: setConfig
    };
}