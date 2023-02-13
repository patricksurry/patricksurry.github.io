---
layout: post
title:  "Geographic heatmap in D3"
date:   2017-11-21
thumbnail: geoheat.png
tags: d3 dataviz
---

<!-- markdownlint-disable MD033 -->

Illustrates how to use Vladimir Agafonkin's clever [simpleheat JS library][simpleheat] to overlay a heatmap of Hopper search destinations on a D3 map.

[simpleheat]: https://github.com/mourner/simpleheat

Just for fun we use a separate svg layer 'under' the canvas to display the map, although it's easy enough to have D3 render direct to the canvas. The default canvas (and svg) 'background' is transparent so we can see through layers, making it easy to build up (say) an animated heatmap over a static map without continually redrawing the latter.

> This was originally a [gist][gist] hosted at bl.ocks.org, which seems dead now. This [clone][clone] might still work.
{: .prompt-info }

[gist]: https://gist.github.com/patricksurry/803a131d4c34fde54b9fbb074341daa5
[clone]: {{site.blocks_url}}/patricksurry/803a131d4c34fde54b9fbb074341daa5

<div>
<div id='container'></div>
</div>

<script src="https://d3js.org/d3.v4.min.js"></script>
<script src="https://d3js.org/topojson.v1.min.js"></script>
<!-- from https://github.com/mourner/simpleheat -->
<script src="https://cdn.jsdelivr.net/npm/simpleheat@0.4.0/simpleheat.min.js"></script>

<style>
#container {
    position: relative;
    width: 800px;
    height: 500px;
}
#container svg, #container canvas {
    position: absolute;
    top: 0;
}
svg {
    background-color: black;
}
svg text {
    font-family: proxima-nova;
    font-size: 12px;
    fill: #666;
}
.countries {
    fill: #333333;
}
.airports {
    fill: #666666;
}
</style>
<script>
const width = 800;
const height = 500;

div = d3.select('#container');
mapLayer = div.append('svg').attr('id', 'map').attr('width', width).attr('height', height);
canvasLayer = div.append('canvas').attr('id', 'heatmap').attr('width', width).attr('height', height);

var canvas = canvasLayer.node(),
    context = canvas.getContext("2d");

// context.globalAlpha = 0.5;

var projection = d3.geoMercator().translate([width/2, height/2]),
    path = d3.geoPath(projection),
    airportMap;

d3.queue()
    .defer(d3.json, '/assets/data/world-50m.json')
    .defer(d3.json, '/assets/data/airports.json')
    .defer(d3.csv, '/assets/data/flexwatch.csv')
    .await(main);

function main(error, world, airports, dests) {
    airports.forEach(d => { d.coords = projection([d.longitude, d.latitude]); })
    airportMap = d3.map(airports, d => d.id);

    var countries = topojson.feature(world, world.objects.countries).features;

    mapLayer
        .append('g')
        .classed('countries', true)
        .selectAll(".country")
          .data(countries)
        .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path);

    mapLayer
      .append('g')
      .classed('airports', true)
      .selectAll('.airport')
        .data(airports)
      .enter().append('circle')
        .attr('r', 1)
            .attr('cx', function(d) { return d.coords && d.coords[0]; })
            .attr('cy', function(d) { return d.coords && d.coords[1]; })

    var heat = simpleheat(canvas);

    // set data of [[x, y, value], ...] format
    heat.data(dests.map(d => {a = airportMap.get(d.destination); return [a.coords[0], a.coords[1], +d.watches]}));

    // set point radius and blur radius (25 and 15 by default)
    heat.radius(10, 10);

    // optionally customize gradient colors, e.g. below
    // (would be nicer if d3 color scale worked here)
    // heat.gradient({0: '#0000ff', 0.5: '#00ff00', 1: '#ff0000'});

    // set maximum for domain
    heat.max(d3.max(dests, d => +d.watches));

    // draw into canvas, with minimum opacity threshold
    heat.draw(0.05);
}
</script>
