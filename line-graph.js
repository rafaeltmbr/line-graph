/*jslint browser for white */

var lineGraph = function (canvasGraph) {
    "use strict";
    var canvas = canvasGraph;
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    var gw = width * 0.8;
    var gwoff = (width - gw) * 0.75;
    var gh = height * 0.8;
    var ghoff = (height - gh) / 2;
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
        }
    };

    var copyAttributes = function (dst, src) {
        Object.keys(src).forEach(function (k) {
            if (typeof dst[k] === typeof src[k])
                dst[k] = src[k];
        });
    };

    var draw = function (graph) {
        ctx.save();

        var yMaxMin = maxMin(graph.record);
        if (checkGraphConfig(graph)) {
            drawLineGraph(graph, yMaxMin);
            drawText(graph, yMaxMin);
        }

        ctx.restore();
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
        validateYText(graph);
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

        if (!(graph.yAxis && typeof graph.yAxis.lines === 'number'))
            graph.yAxis = {
                lines: 2
            };

        if (typeof graph.yAxis.precision === 'undefined')
            graph.yAxis.precision = 0;
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

    var validateYText = function (graph) {
        if (!graph.yAxis)
            graph.yAxis = {};

        if (typeof graph.yAxis.title !== 'string')
            graph.yAxis.title = "";

        if (!graph.yAxis.verticalTitle)
            graph.yAxis.verticalTitle = false;
    };

    var validateConfig = function (config) {
        validateTitle(config);
        validateXAxis(config);
        validateYAxis(config);
    };

    var validateTitle = function (config) {
        if (!config.title)
            return;

        Object.keys(config.title).forEach(function (k) {
            if (validName(config.title[k]) && typeof cfg.title[k] !== 'undefined')
                cfg.title[k] = config.title[k];
        });
    };

    var validateXAxis = function (config) {
        if (config.xAxis)
            copyAttributes(cfg.xAxis, config.xAxis);
    };

    var validateYAxis = function (config) {
        if (config.xAxis)
            copyAttributes(cfg.yAxis, config.yAxis);
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

        for (let i = 1; i < 10; i += 1) {
            drawVerticalLine(gwoff + i * gw / 10, ghoff, gh + ghoff);
            drawHorizontalLine(ghoff + i * gh / 10, gwoff, gw + gwoff);
        }
        drawEdges();
    };

    var drawEdges = function () {
        ctx.strokeStyle = "black";
        drawVerticalLine(gwoff, ghoff, gh + ghoff);
        drawHorizontalLine(ghoff, gwoff, gw + gwoff);
        drawVerticalLine(gwoff + 10 * gw / 10, ghoff, gh + ghoff);
        drawHorizontalLine(ghoff + 10 * gh / 10, gwoff, gw + gwoff);
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

    var drawLineGraph = function (graph, yMaxMin) {
        setupLines(graph.color);
        drawCurve(graph, yMaxMin);
        drawCurveShadow(graph, yMaxMin);

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
        if (graph.record[0] >= 0) {
            var constHeight = gh + ghoff -
                gh * (graph.height.max + graph.height.min) / 2;
        } else {
            var constHeight = gh - graph.height.min * gh + ghoff;
        }
        drawHorizontalLine(constHeight, gwoff, gw + gwoff);
    };

    var drawLines = function (graph, yMaxMin) {
        var length = graph.record.length;
        var xStep = gw / (length - 1);
        var yStep = (graph.height.max - graph.height.min) * gh /
            (yMaxMin.max - yMaxMin.min);
        var yOffset = gh - graph.height.min * gh + ghoff;
        ctx.moveTo(gwoff, yOffset - (graph.record[0] - yMaxMin.min) * yStep);

        for (let i = 1; i < length; i += 1)
            ctx.lineTo(i * xStep + gwoff,
                yOffset - (graph.record[i] - yMaxMin.min) * yStep);

        ctx.stroke();
    };

    var drawCurveShadow = function (graph, yMaxMin) {
        var constantValue = yMaxMin.max - yMaxMin.min === 0;
        var bottom = gh + ghoff - gh * graph.height.min;
        if (constantValue && yMaxMin.max <= 0)
            bottom = bottom - gh * (graph.height.max - graph.height.min) / 2;

        ctx.lineTo(gw + gwoff, bottom);
        ctx.lineTo(gwoff, bottom);
        ctx.closePath();
        ctx.fill();
    };

    var drawXAxis = function (graph, yMaxMin) {
        ctx.beginPath();
        ctx.strokeStyle = graph.color.axis;

        var xHeight = getXAxisHeight(graph, yMaxMin);
        ctx.moveTo(gwoff, xHeight);
        ctx.lineTo(gw + gwoff, xHeight);
        ctx.stroke();
    };

    var getXAxisHeight = function (graph, yMaxMin) {
        var yDiff = yMaxMin.max - yMaxMin.min;
        var hDiff = (graph.height.max - graph.height.min) * gh;
        var offset = (yMaxMin.max > 0 ? 0 : -hDiff / 2);

        if (yDiff) {
            var yStep = hDiff / yDiff;
            var yOffset = gh - graph.height.min * gh + ghoff;
            return yOffset + yMaxMin.min * yStep;
        } else {
            return gh + ghoff - gh * graph.height.min + offset;
        }
    };

    var drawText = function (graph, yMaxMin) {
        ctx.textAlign = "center";
        drawTitle();
        drawXText();
        drawYText(graph, yMaxMin);
    };

    var drawTitle = function () {
        ctx.textBaseline = "bottom";
        ctx.font = cfg.title.font;
        ctx.fillStyle = cfg.title.color;
        ctx.fillText(cfg.title.name, gw / 2 + gwoff, ghoff * 0.75);
    };

    var drawXText = function () {
        ctx.textBaseline = "top";
        ctx.font = cfg.xAxis.font;
        ctx.fillStyle = cfg.xAxis.textColor;
        var steps = cfg.xAxis.values.length;
        var space = gw / (steps - 1);

        for (let i = 0; i < steps; i += 1)
            ctx.fillText(cfg.xAxis.values[i] + "", gwoff + space * i,
                gh + ghoff * 1.2);
    };

    var drawYText = function (graph, yMaxMin) {
        if (graph.yAxis.lines < 2)
            return;

        setupYText(graph);
        var lim = getFormattedLimit(graph.record, yMaxMin)
        var diff = lim.max - lim.min;
        var valueStep = diff / (graph.yAxis.lines - 1);
        var yOffset = gh - graph.height.min * gh + ghoff;
        var yStep = (graph.height.max - graph.height.min) /
            (graph.yAxis.lines - 1) * gh;

        if (diff)
            drawVariableYText(graph, valueStep, lim, yOffset, yStep);
        else
            drawConstantYText(graph, lim.min, yOffset);

        drawYTitle(graph);
    };

    var setupYText = function (graph) {
        ctx.fillStyle = graph.color.stroke;
        ctx.font = cfg.yAxis.font;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
    };

    var getFormattedLimit = function (record, yMaxMin) {
        return {
            min: formatMin(yMaxMin.min),
            max: formatMax(yMaxMin.max)
        };
    };

    var drawVariableYText = function (graph, valueStep, limits, yOffset, yStep) {
        for (let i = 0; i < graph.yAxis.lines; i += 1)
            ctx.fillText((valueStep * i + limits.min).toFixed(graph.yAxis.precision),
                gwoff * 0.9, yOffset - yStep * i);
    };

    var drawConstantYText = function (graph, value) {
        var lineLow = gh + ghoff - gh * graph.height.min;
        var lineHigh = lineLow - gh * (graph.height.max - graph.height.min) / 2;
        var lineZero = (value > 0 ? lineLow : lineHigh);
        var lineConst = (value >= 0 ? lineHigh : lineLow);

        ctx.fillText(value.toFixed(graph.yAxis.precision), gwoff * 0.9, lineConst);

        if (graph.xAxis)
            ctx.fillText('0', gwoff * 0.9, lineZero);
    };

    var drawYTitle = function (graph) {
        ctx.save();
        ctx.textAlign = "center";

        var horizontalHeight = gh + ghoff - gh * graph.height.max;
        var verticalHeight = horizontalHeight +
            (graph.height.max - graph.height.min) / 2 * gh;

        if (graph.yAxis.verticalTitle) {
            ctx.translate(gwoff * 0.2, verticalHeight);
            ctx.rotate(Math.PI * 1.5);
            ctx.fillText(graph.yAxis.title, 0, 0);
        } else {
            ctx.fillText(graph.yAxis.title, gwoff / 2, horizontalHeight - ghoff / 2);
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

    drawGrid();
    return {
        draw: draw,
        clear: clear,
        setConfig: validateConfig
    };
}