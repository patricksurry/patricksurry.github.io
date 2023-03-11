---
layout: post
title:  "The Mandelsnake"
date:   2023-02-26
thumbnail: mandelsnake.jpg
math: true
tags: math dataviz
---

<!-- markdownlint-disable MD033 -->

An exercise for the reader:
[Is there an analogue of the Gosper flowsnake on the Cartesian lattice?][analogue]

[analogue]: https://math.stackexchange.com/questions/4638713/is-there-an-analogue-of-the-gosper-flowsnake-on-the-cartesian-lattice


<style>
svg {
    display: block;
    margin: 0 auto;
}
text {
    stroke: none;
    fill: #333;
    font: 0.4px sans-serif;
    text-anchor: middle;
}
path {
    vector-effect: non-scaling-stroke;
    fill: none;
}
.twist {
    stroke-width: 2px;
    stroke: red;
    stroke-dasharray: 5 3;
    opacity: 75%;
}
.seq {
    stroke-width: 4px;
    stroke: white;
    opacity: 50%;
}
.square {opacity: 75%}
</style>

<div id="mandelsnake"></div>
<div class=caption markdown=1>
the caption
</div>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script type="module">
import {inttom5, m5tomosaic, mosaictoxy, squareboundary} from '/assets/js/mandelsnake.js';
import {turboRGB} from '/assets/js/turbocmap.js';
//
const
    start = parseInt('-1313', 5),
    end = parseInt('3131', 5),
    xys = [...Array(end-start+1).keys()].map(i => mosaictoxy(m5tomosaic(inttom5(start+i)))),
    scale = 1.2*Math.max(...xys.map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))),
    svg = d3.select('#mandelsnake')
        .append('svg')
        .attr('width', 800)
        .attr('height', 800)
        .attr('viewBox', `-${scale} -${scale} ${2*scale} ${2*scale}`),
    line = d3.line(d => d.x, d => d.y),
    osq = line(squareboundary({x: 0, y: 0}))+'Z',
    color = i => turboRGB(i/xys.length),
    gs = svg.append('g')
        .selectAll('g')
        .data(xys)
        .join('g')
        .attr('class', 'square')
        .attr('transform', p => `translate(${p.x}, ${p.y})`);
//
gs.append('path')
    .attr('d', osq)
    .style('fill', (_, i) => color(i));
gs.append('text')
    .attr('dy', 0.4)
    .text((_, i) => inttom5(start+i))
//
svg.append('path')
    .attr('class', 'seq')
    .attr('d', line(xys));
</script>
