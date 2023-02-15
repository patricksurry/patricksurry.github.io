---
layout: post
title:  "Rolling pan and zoom with D3 Mercator projection"
date:   2013-09-19
thumbnail: rollpan.jpg
tags: d3 dataviz
---

<!-- markdownlint-disable MD033 -->

An example illustrating zoom and pan with a "rolling" Mercator projection in D3.
Drag left-right to rotate projection cylinder, and up-down to translate, clamped by max absolute latitude. Ensures projection always fits properly in viewbox.

> This was originally a [gist][gist] hosted at bl.ocks.org, which seems dead now. This [clone][clone] might still work.
{: .prompt-info }

[gist]: https://gist.github.com/patricksurry/6621971
[clone]: {{site.blocks_url}}/patricksurry/6621971

<div id='demo'></div>

<script src="https://d3js.org/d3.v3.min.js"></script>
<script src="https://d3js.org/topojson.v1.min.js"></script>
<style>
svg {
  background-color: lavender;
  border: 1px solid black;
  margin: 0 auto;
  display: block;
}

path {
  fill: oldlace;
  stroke: #666;
  stroke-width: .5px;
}
</style>
<!-- markdownlint-disable MD052 -->
<script>
var width = 600,
    height = 400,
    rotate = 60,        // so that [-60, 0] becomes initial center of projection
    maxlat = 83;        // clip northern and southern poles (infinite in mercator)

var projection = d3.geo.mercator()
    .rotate([rotate,0])
    .scale(1)           // we'll scale up to match viewport shortly.
    .translate([width/2, height/2]);

// find the top left and bottom right of current projection
function mercatorBounds(projection, maxlat) {
    var yaw = projection.rotate()[0],
        xymax = projection([-yaw+180-1e-6,-maxlat]),
        xymin = projection([-yaw-180+1e-6, maxlat]);

    return [xymin,xymax];
}

// set up the scale extent and initial scale for the projection
var b = mercatorBounds(projection, maxlat),
    s = width/(b[1][0]-b[0][0]),
    scaleExtent = [s, 10*s];

projection
    .scale(scaleExtent[0]);

var zoom = d3.behavior.zoom()
    .scaleExtent(scaleExtent)
    .scale(projection.scale())
    .translate([0,0])               // not linked directly to projection
    .on("zoom", redraw);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.selectAll('#demo')
    .append('svg')
        .attr('width',width)
        .attr('height',height)
        .call(zoom);

d3.json("/assets/data/world-50m.json", function ready(error, world) {

    svg.selectAll('path')
        .data(topojson.feature(world, world.objects.countries).features)
      .enter().append('path')

    redraw();       // update path data
});

// track last translation and scale event we processed
var tlast = [0,0],
    slast = null;

function redraw() {
    if (d3.event) {
        var scale = d3.event.scale,
            t = d3.event.translate;

        // if scaling changes, ignore translation (otherwise touch zooms are weird)
        if (scale != slast) {
            projection.scale(scale);
        } else {
            var dx = t[0]-tlast[0],
                dy = t[1]-tlast[1],
                yaw = projection.rotate()[0],
                tp = projection.translate();

            // use x translation to rotate based on current scale
            projection.rotate([yaw+360.*dx/width*scaleExtent[0]/scale, 0, 0]);
            // use y translation to translate projection, clamped by min/max
            var b = mercatorBounds(projection, maxlat);
            if (b[0][1] + dy > 0) dy = -b[0][1];
            else if (b[1][1] + dy < height) dy = height-b[1][1];
            projection.translate([tp[0],tp[1]+dy]);
        }
        // save last values.  resetting zoom.translate() and scale() would
        // seem equivalent but doesn't seem to work reliably?
        slast = scale;
        tlast = t;
    }

    svg.selectAll('path')       // re-project path data
        .attr('d', path);
}
</script>
