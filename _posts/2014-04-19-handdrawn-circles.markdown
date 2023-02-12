---
layout: post
title:  "Hand drawn circles"
date:   2014-04-19
thumbnail: handdrawn-circles.png
math: true
tags: math dataviz
---

I wanted to draw a month-at-a-glance calendar page with several days circled,
but drawing perfect circles looked odd,
so I looked for a way to imitiate hand-drawn (imperfect) circles.
**TL;DR**
Cubic Bézier segments do the trick,
based on [this approximation to a perfect circle][approx].

[approx]: https://spencermortensen.com/articles/bezier-circle/

> This was originally a [gist][gist] hosted at bl.ocks.org, which seems dead now. This [clone][clone] might still work.
{: .prompt-info }

[gist]: https://gist.github.com/patricksurry/11087975
[clone]: https://blocks.roadtolarissa.com/patricksurry/11087975

<svg id='perturb0' width='100' height='100' viewBox="-1.5 -1.5 3 3"></svg>


For my application the circles don't need to be closed since I'm not filling them,
but that would be an easy modification.
<svg class="inset" width='100' height='100' viewBox="-0.5 -0.5 2 2">
    <path class='pencil' d="M0,1 C0.552,1 1,0.552 1,0"/>
    <circle cx="0" cy="1" r="0.04"/>
    <circle cx="0.552" cy="1" r="0.04"/>
    <circle cx="1" cy=".552" r="0.04"/>
    <circle cx="1" cy="0" r="0.04"/>
</svg>

I started from this [nice approximation][approx] of a perfect circle based on
cubic B&eacute;zier segments, where they show that a good approximation
to a quarter circle of unit radius is a cubic B&eacute;zier curve with control points
$P_0 = (0, 1)$, $P_1 = (c, 1)$, $P_2 = (1, c)$, $P_3 = (1, 0)$
where $c = 0.551915024494$.
For example we can use this SVG, with the control points shown in red: <code>&lt;path d="M0,1 C0.552,1 1,0.552 1,0"/></code>

<svg class="inset" width='100' height='100' viewBox="-1.5 -1.5 3 3">
    <path class='pencil' d="M0,1 C0.552,1 1,0.552 1,0 S0.552,-1 0,-1 S-1,-0.552 -1,0 S-0.552,1 0,1"/>
    <circle cx="0" cy="1" r="0.06"/>
    <circle cx="1" cy="0" r="0.06"/>
    <circle cx="0" cy="-1" r="0.06"/>
    <circle cx="-1" cy="0" r="0.06"/>
</svg>

To draw a full circle, we just chain four of these together, using a path like this:
<code>&lt;path d="M0,1 C0.552,1 1,0.552 1,0 S0.552,-1 0,-1 S-1,-0.552 -1,0 S-0.552,1 0,1"/></code>

To make an approximate circle it's easier to work in polar coordinates
representing points as a radius and angle
relative to the origin, $(r, \theta)$.
In polar coordinates the four control points for each arc become
$P_0 = (1, 0)$,
$P_1 = (d, \beta)$,
$P_2 = (d, \pi/2 - \beta)$,
$P_3 = (1, \pi/2)$,
where $\beta = \arctan c$ and $d = \sqrt{c^2+1}$.


Now we just need to add a bit of randomness as we generate the path.
I decided to do this in four ways:

1. Add a random delta to the current radius (starting from <em>r</em> = 1)
    when we generate the start of each quarter
    (along with its corresponding control points).
    If we bias the change to be slightly positive (or negative), the circle ends up
    looking more like a spiral.

2. Start the path at a random angle.

3. Add a random delta to the angle we rotate for each quarter, instead of
    exactly $\pi/2$.  If we bias the change to be slightly positive
    (or negative) then the circle tends to overshoot (undershoot) the starting point.

4. Squash the circle using a non-uniform scaling and random rotation.
    If we bias the scaling to be more or less than one we can make the circles tend to
    fit inside a fixed outline for example.

<div class="svg-group">
    <svg id='perturb1' width='100' height='100' viewBox="-1.5 -1.5 3 3"></svg>
    <svg id='perturb2' width='100' height='100' viewBox="-1.5 -1.5 3 3"></svg>
    <svg id='perturb3' width='100' height='100' viewBox="-1.5 -1.5 3 3"></svg>
    <svg id='perturb4' width='100' height='100' viewBox="-1.5 -1.5 3 3"></svg>
</div>

If we plan to draw lots of circles, we might want to choose the random variations
from a limited range so they all look like the same "handwriting".  Try experimenting:

Radius variation (0: none, &lt;0: shrink, &gt;0: grow)
    <span class='inputs'>
    <label for="drmin">min</label><input name='drmin' id='drmin' value='-0.1'>
    <label for="drmax">max</label><input name='drmax' id='drmax' value='0'>
    </span>

Starting angle (0-360):
    <span class='inputs'>
    <label for="amin">min</label><input name='amin' id='amin' value='200'>
    <label for="amax">max</label><input name='amax' id='amax' value='240'>
    </span>

Rotation variation (0: none, &lt;0: undershoot, &gt;0: overshoot)
    <span class='inputs'>
    <label for="damin">min</label><input name='damin' id='damin' value='0'>
    <label for="damax">max</label><input name='damax' id='damax' value='0.2'>
    </span>

Squash factor (1: none, &lt;1: shrink, &gt;1: grow)
    <span class='inputs'>
    <label for="smin">min</label><input name='smin' id='smin' value='0.6'>
    <label for="smax">max</label><input name='smax' id='smax' value='0.8'>
    </span>

Squash orientation (0-360)
    <span class='inputs'>
    <label for="samin">min</label><input name='samin' id='samin' value='30'>
    <label for="samax">max</label><input name='samax' id='samax' value='50'>
    </span>

<div id="gallery"></div>

<style>
input {
    width: 4em;
    margin: 0 15px;
}
span.inputs {
    float: right;
}
svg {
    background: #eee;
}
svg.inset {
    float: left;
    margin-right: 20px;
}
#perturb0 {
    float: right;
    margin-left: 20px;
}
div.svg-group {
    text-align: center;
    margin: auto;
}
.svg-group svg {
    margin: 10px;
}
circle {
  stroke: none;
  fill: red;
}
path.pencil {
  stroke-width: 2px;
  stroke: #666;
  stroke-linecap: round;
  fill: none;
  vector-effect: non-scaling-stroke;
}
circle.reference {
  stroke: #ccc;
  stroke-width: 1px;
  vector-effect: non-scaling-stroke;
  fill: none;
}
</style>
<script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script charset="utf-8">
function circlePath(δr_min,δr_max, θ0_min, θ0_max, δθ_min,δθ_max) {
    var c = 0.551915024494,
        β = Math.atan(c),
        d = Math.sqrt(c*c+1*1),
        r = 1,
        θ = (θ0_min + Math.random()*(θ0_max - θ0_min))*Math.PI/180,
        path = 'M';

    path += [r * Math.sin(θ), r * Math.cos(θ)];
    path += ' C' + [d * r * Math.sin(θ + β), d * r * Math.cos(θ + β)];

    for (var i=0; i<4; i++) {
        θ += Math.PI/2 * (1 + δθ_min + Math.random()*(δθ_max - δθ_min));
        r *= (1 + δr_min + Math.random()*(δr_max - δr_min));
        path += ' ' + (i?'S':'') + [d * r * Math.sin(θ - β), d * r * Math.cos(θ - β)];
        path += ' ' + [r * Math.sin(θ), r * Math.cos(θ)];
    }

    return path;
}
function circleXform(λ_min, λ_max, θ_min, θ_max) {
    var θ = (θ_min + Math.random()*(θ_max - θ_min));
    return 'rotate(' + θ + ') '
        + 'scale(1, ' + (λ_min + Math.random()*(λ_max - λ_min)) + ')'
        + 'rotate(' + (-θ) + ')';
}

d3.select('#perturb1')
    .append('path')
    .classed('pencil', true)
    .attr('d', circlePath(-0.1,0, 0,0, 0,0));
d3.select('#perturb2')
    .append('path')
    .classed('pencil', true)
    .attr('d', circlePath(-0.1,0, 0,360, 0,0));
d3.select('#perturb3')
    .append('path')
    .classed('pencil', true)
    .attr('d', circlePath(-0.1,0, 0,360, 0,0.2));
d3.selectAll('#perturb4, #perturb0')
    .append('path')
    .classed('pencil', true)
    .attr('d', circlePath(-0.1,0, 0,360, 0,0.2))
    .attr('transform', circleXform(0.6, 0.8, 0, 360));

d3.select('#gallery')
    .selectAll('div')
    .data(d3.range(5))
  .enter().append('div')
    .classed('svg-group',true)
    .selectAll('svg')
    .data(function(d) { return d3.range(5); })
  .enter().append('svg')
    .attr('width', 100)
    .attr('height', 100)
    .attr('viewBox', "-1.5 -1.5 3 3");

function drawCircles() {
    $('#gallery svg').html('');
    var svg = d3.selectAll('#gallery svg');
    svg.append('circle')
        .classed('reference',true)
        .attr('r',1);
    svg.append('path')
        .classed('pencil', true)
        .attr('d', function() { return circlePath(
            +$('#drmin').val(), +$('#drmax').val(),
            +$('#amin').val(), +$('#amax').val(),
            +$('#damin').val(), +$('#damax').val()); })
        .attr('transform', function() { return circleXform(
            +$('#smin').val(), +$('#smax').val(),
            +$('#samin').val(), +$('#samax').val()); });
}
drawCircles();

$('input').change(drawCircles);

</script>