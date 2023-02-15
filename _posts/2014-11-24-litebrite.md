---
layout: post
title:  "Litebrite flight shopping animation"
date:   2014-11-24
thumbnail: litebrite.jpg
tags: dataviz d3 hexagons
---

This is a simple D3 animation of flight shopping data for a single route,
inspired by [LiteBrite][litebrite].
A number of interesting patterns surface, like the downward pointing red triangles
corresponding to expensive mid-week trips without a Saturday night stay,
and small upward pointing triangles showing quick weekend trips.
Travel gets cheaper after summer vacation (early September),
but prices rise as departure approaches as shoppers tend to procrastinate and
business travelers are late entrants to the market.
Diamond-shaped blocks light up in response to flexible shopping queries like
travel dates &plusmn; 3 days.

[litebrite]: https://en.wikipedia.org/wiki/Lite-Brite

<!-- markdownlint-disable MD033 -->

<svg id='carpet'>
    <defs>
        <marker id="arrowHead" markerWidth="6" markerHeight="6" refx="6" refy="3"
                orient="auto">
            <path d="M0,0 L0,6 L6,3 L0,0" style="fill: #999;"></path>
        </marker>
    </defs>
</svg>

We use a hexagonal grid to show shopping results, with each cell
representing specific travel dates.
Departure date reads left to right for a sixty day period from Aug 1 to Oct 1.
Each row shows length of
stay with the top row indicating same day return (rare for Boston to London)
and the bottom row being a three week stay.
Columns diagonally down to the right are fixed departure dates,
and columns diagonally up to the right are fixed return dates
thanks to the identity *departure date + length of stay = return date*.

We animate flight shopping queries over time (displayed at top left)
with time accelerated to about one shopping day per second.
Bubble size indicates the volume of shopping
(short advance and shorter stays tend to be more popular)
and color shows price.
Trips in the past are greyed out as shopping date exceeds departure date.

<!-- markdownlint-disable MD011 MD018 MD037 -->

<style>
#carpet {
    background-color: black;
    margin-bottom: 1rem;
}
#carpet text {
  font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 8pt;
  fill: #999;
  color: #999;
}
#carpet text.title { font-size: 12pt; }
.arrow {
    stroke: #999;
    marker-end: url(#arrowHead);
}
.hexagon path {
    stroke: #666;
    stroke-width: 1;
}
.hexagon.highlight-x path {
    fill: lightblue !important;
}
.hexagon.highlight-xs path {
    fill: lightgreen !important;
}
.hexagon.highlight-y path {
    fill: pink !important;
}
.hexagon.highlight-hex path {
    fill: yellow !important;
}
.label-x .weekend {
    font-weight: bold;
    }
.labels {
    text-anchor: end;
}
.labels .title-x, .labels .title-y {
    text-anchor: middle;
}
.key {
    text-anchor: middle;
}
</style>

<script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
<script src="/assets/js/colorlegend.js"></script>
<script>

function getParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var route = getParam('route') || 'BOS-LHR',
    ffwd = getParam('ffwd'),
    decay = getParam('decay') || 0.95;

d3.csv(`/assets/data/ticks-${route}.csv`, animate)

var width = 900, height = 400, radius=6;

var svg = d3.select('#carpet')
    .attr('width', width)
    .attr('height', height);

svg = svg
    .append('g')
    .attr('transform', 'translate(40, 110)');

svg.append('text')
    .attr('class', 'title')
    .attr('x', 250)
    .attr('y', -80)
    .text("Visual history of flight prices for " + route);

Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

Date.prototype.toYMD = function() {
    return this.toISOString().slice(0,10);
}

var daysofweek = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];

function animate(error, ticks) {

    var startDate = new Date('2014/8/1'),
        days = 60;

    // make a grid and label it
    hexGrid(svg, 0, days, 0, 21, function(x,y) {
                return startDate.addDays(x).toYMD() + '/' + startDate.addDays(x+y).toYMD();
            });

    svg.selectAll('.label-x text')
        .datum(function(d) {
            return startDate.addDays(d);
        })
        .text(function(d) {
            var dow = d.getDay(), s = daysofweek[dow].slice(0,1);
            if (dow == 0) { s = (d.getMonth()+1) + '/' + d.getDate() + ' ' + s; }
            return s;
        })
        .classed('weekend', function(d) { return (d.getDay() + 1)%7 < 2; });

    svg.selectAll('.label-xs text')
        .datum(function(d) {
            return startDate.addDays(d);
        })
        .text(function(d) {
            var dow = d.getDay(), s = daysofweek[dow].slice(0,1);
            if (dow == 0) { s = (d.getMonth()+1) + '/' + d.getDate() + ' ' + s; }
            return s;
        })
        .classed('weekend', function(d) { return (d.getDay() + 1)%7 < 2; });

    var key = svg.append('g')
        .classed('key', true)
        .attr('transform', 'translate(-10,200)');
    key.append('path')
        .classed('arrow', true)
        .attr('d', 'M 8 70 l 64 0');
    key.append('text')
        .classed('key-label', true)
        .attr('transform', 'translate(40, 84)')
        .text('Same stay');
    key.append('path')
        .classed('arrow', true)
        .attr('d', 'M 44 7 l 32 56');
    key.append('text')
        .classed('key-label', true)
        .attr('transform', 'translate(68, 30) rotate(60)')
        .text('Same departure');
    key.append('path')
         .classed('arrow', true)
        .attr('d', 'M 36 7 l -32 56');
    key.append('text')
        .classed('key-label', true)
        .attr('transform', 'translate(12, 30) rotate(-60)')
        .text('Same return');

    var g = svg.append('g')
        .attr('transform', 'translate(50, -90)')
    g.append('text')
        .classed('labels', true)
        .attr('dx','-1em')
        .text('Search time:')
    g.append('text')
        .attr('id', 'search-time')
        .text('');

    // put empty circles in the grid
    var grid = d3.selectAll('.hexagon');
    grid
        .append('circle')
        .attr('r', 0)
        .style('opacity', 1)
        .style('fill', '#000');

    grid.each(function (d) {
            var dep = new Date(), ret = new Date();
            dep.setDate(dep.getDate() + d.x);
            ret.setDate(ret.getDate() + d.xs);

            d.departure = dep.toLocaleDateString();
            d.dep_dow = dep.getDay();
            d.return = ret.toLocaleDateString();
            d.ret_dow = ret.getDay();
        })
        .classed('depart-we', function(d) { return d.dep_dow == 0 || d.dep_dow == 6 })
        .classed('return-we', function(d) { return d.ret_dow == 0 || d.ret_dow == 6 });

    grid
        .append('svg:title')
        .text(function (d) {
            return d.key;
            /*
            return 'Depart ' + daysofweek[d.dep_dow] + ' ' + d.departure
                + ', return ' + daysofweek[d.ret_dow] + ' ' + d.return
                + ' (stay ' + d.y + ' nights)';
            */
        });

    ticks.forEach(function(d) { d.key = new Date(d.departure_odate).toYMD() + '/' + new Date(d.return_ddate).toYMD(); });

    if (ffwd) {
        var seconds = (new Date(ffwd)).getTime()/1000.;

        ffwd = 0;
        while (+ticks[ffwd].received < seconds) ffwd++;

    } else {
        ffwd = 0;
    }

    // accumulate history to a given point
    // scale count based on number of days of history by dividing by (1-decay^n)/(1-decay)
    var histdays = ffwd > 0 ? Math.max(1., (ticks[ffwd-1].received - ticks[0].received)/3600.) : 1,
        factor = (1-Math.pow(decay, histdays))/(1-decay),
        history = d3.nest()
        .key(function(d) { return d.key; })
        .rollup(function(ticks) { return { shops: ticks.length / factor, total: +ticks[ticks.length-1].total }})
        .entries(ticks.slice(0, ffwd));

    // bucket our data by period
    var period = d3.nest()
        .key(function(d) {
            // Bucket by hours
            return 3600. * Math.floor(d.received/(3600.));
        })
        .entries(ticks.slice(ffwd));

    var shopScale = d3.scale.sqrt()
        .domain([0, 1])
        .range([0, radius])
        .clamp(true)

    var sample = ticks
        .filter(function(d, i) { return ticks.length < 10000 ? true : (i % Math.round(ticks.length/10000) == 0) })
        .map(function(d) { return +d.total; });
    sample.sort(function(a,b) { return a - b });

    var minPrice = sample[Math.round(sample.length*0.01)],
        maxPrice = sample[Math.round(sample.length*0.90)],
        bounds = d3.scale.linear().domain([minPrice, maxPrice]).nice().domain()

    var priceColor_ = d3.scale.quantize()
        .domain([Math.log(bounds[0]), Math.log(bounds[1])])
        .range(["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"].reverse());

    function priceColor(p) {
        return priceColor_(Math.log(p))
    }

    // add a legend
    colorlegend(svg, priceColor_, "quantize",
                { title: "Recent price",
                  x: -10, y: -75,
                  boxWidth: 10, boxHeight: 6,
                  tickFormat: function(v) { return '$' + Math.round(Math.exp(v)) }
                });

    // for each period, update the grid
    var searchTimeFormat = d3.time.format('%a %b %-d, %-I%p'),
        lastSearchDay = null;

    function update(p, millis) {
        var tickmap = d3.map(),
            dt = new Date(0);

        dt.setUTCSeconds(+p.key);

        d3.select('#search-time').text(searchTimeFormat(dt));

        p.values.forEach(function(d){ tickmap.set(d.key, +d.total); });

        // merge in the new values
        grid.data()
            .map(function(d) {
                if (tickmap.has(d.key)) {
                    d.shops = d.hasOwnProperty('shops') ? (d.shops + 1) : 1;
                    d.total = tickmap.get(d.key);
                }
            });

        if (dt.toYMD() != lastSearchDay) {
            // daily rescale
            grid.data().map(function(d) {
                if (d.hasOwnProperty('shops') & !d.hasOwnProperty('past')) d.shops *= decay;
            })
            refreshgrid();
            grid.selectAll('circle')
                .filter(function(d) {
                    var past = (d.key.split('/')[0] <= lastSearchDay);
                    if (past) d.past = true;
                    return past;
                })
                .transition()
                .duration(millis*6)
                .style('opacity', 0.3);
            lastSearchDay = dt.toYMD();
        }

        // draw just the updated items
        grid.selectAll('circle')
            .filter(function(d) { return tickmap.has(d.key); })
            .transition()
            .duration(millis)
            .attr('r', 1.1*radius)
            .transition()
            .duration(millis)
            .style('fill', function(d) { return priceColor(d.total) })
            .attr('r', function(d) { return shopScale(d.shops) });
    }

    function initgrid(history) {
        var updatemap = d3.map();

        history.forEach(function(d) { updatemap.set(d.key, d.values); });

        // merge updates
        grid.data()
            .map(function(d) {
                if (updatemap.has(d.key)) {
                    var update = updatemap.get(d.key);
                    d.shops = update.shops;
                    d.total = update.total;
                }
            });
    }

    function refreshgrid() {
        shopScale.domain([0, d3.max(grid.data(), function(d) { return d.shops || 1 })]);

        grid.selectAll('circle')
            .filter(function(d) { return d.hasOwnProperty('shops') })
            .style('fill', function(d) { return priceColor(d.total) })
            .attr('r', function(d) { return shopScale(d.shops) });
    }

    var lastkey = null;
    function ticker() {
        var p;
        if (period.length > 0) {
            if (lastkey && +period[0].key > lastkey + 3600) {
                // insert an empty hour
                lastkey += 3600;
                p = { key: lastkey, values: []};

            } else {
                p = period.shift();
                lastkey = +p.key;
            }
            update(p, 250);
            setTimeout(ticker, 1000/12);
        }
    }

    initgrid(history)
    refreshgrid()
    ticker()
}

function hexGrid(svg, xmin, xmax, ymin, ymax, key) {

    var labels = svg.append('g')
        .attr('class', 'labels');

    labels.append('text')
        .classed('title-x', true)
        .attr('transform', 'translate(' + hexCenter((xmax+xmin)/2, -5, radius) + ')')
        .text('Departure date');

    labels.append('text')
        .classed('title-xs', true)
        .attr('transform', 'translate(' + hexCenter((xmax+xmin)/2, ymax+5, radius) + ')')
        .text('Return date');

    labels.append('text')
        .classed('title-y', true)
        .attr('transform', 'translate(' + hexCenter(-4, (ymax+ymin)/2, radius) + ') rotate(60)')
        .text('Length of stay');

    labels.selectAll('.label-x')
        .data(d3.range(xmin, xmax+1))
      .enter().append('g')
        .attr('class', 'label-x')
        .attr('transform', function(d) { return 'translate(' + hexCenter(d, -1, radius) + ') rotate(60)'; })
        .append('text')
        .attr('dy','0.3em')
        .text(function(d) { return d; });

    labels.selectAll('.label-xs')
        .data(d3.range(ymax + xmin, ymax + xmax+1))
      .enter().append('g')
        .attr('class', 'label-xs')
        .attr('transform', function(d) { return 'translate(' + hexCenter(d - ymax - 1, ymax + 1, radius) + ') rotate(-60)'; })
        .append('text')
        .attr('dy','0.3em')
        .text(function(d) { return d; });

    labels.selectAll('.label-y')
        .data(d3.range(ymin, ymax+1))
      .enter().append('g')
        .attr('class', 'label-y')
        .attr('transform', function(d) { return 'translate(' + hexCenter(-1, d, radius) + ')'; })
        .append('text')
        .attr('dy','0.3em')
        .text(function(d) { return d; });

    var data = hexGridData(xmin, xmax, ymin, ymax, key);

    var grid = svg.append('g')
        .attr('class', 'grid')
        .selectAll('.hexagon')
        .data(data, function(d) { return d.key; })
      .enter().append('g')
        .attr('transform', function(d) { return 'translate(' + hexCenter(d.x, d.y, radius) + ')';})
        .attr('class', 'hexagon')
        .on('mouseover', hexHighlight(true))
        .on('mouseout',  hexHighlight(false));
}

function hexGridData(xmin, xmax, ymin, ymax, key) {
    var grid = [];
    for (var x=xmin; x<=xmax; x++) {
        for (var y=ymin; y<=ymax; y++) {
            var p = {key: key(x,y), x: x, y: y, xs: x+y};
            grid.push(p);
        }
    }
    return grid;
}

function hexHighlight(enabled) {
  return function() {
    var hex = d3.select(this),
        p = hex.datum();
    hex.classed('highlight-hex', enabled);
    d3.selectAll('.hexagon')
        .filter(function(d) { return d.xs == p.xs; })
        .classed('highlight-xs', enabled);
    d3.selectAll('.hexagon')
        .filter(function(d) { return d.x == p.x; })
        .classed('highlight-x', enabled);
    d3.selectAll('.hexagon')
        .filter(function(d) { return d.y == p.y; })
        .classed('highlight-y', enabled);
 }
}

function hexCenter(x, y, r) {
    var cx = (2 * x + y) * r,
        cy = Math.sqrt(3) * y * r;
    return [cx, cy];
}

function hexPath(x, y, r) {
    var c = hexCenter(x, y, r),
        cx = c[0], cy = c[1],
        r1 = r * 2 / Math.sqrt(3),
        r2 = r / Math.sqrt(3);
    return 'M' + [cx,cy-r1] + ' L' + [cx+r,cy-r2] + ' L' + [cx+r,cy+r2] + ' L' + [cx,cy+r1] + ' L' + [cx-r,cy+r2] + ' L' + [cx-r,cy-r2] + ' Z';
}
</script>
