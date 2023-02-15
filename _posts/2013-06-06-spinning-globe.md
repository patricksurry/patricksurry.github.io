---
layout: post
title: "Rotating a 3D globe with D3"
date: 2013-06-06
thumbnail: globe3d.png
tags: d3 dataviz
---

This example illustrates a simple trackball approach for rotating an orthographic globe with D3 3.0.  Click and drag on the globe animation below.
The idea is to express the click location in spherical coordinates with two orthogonal rotations:
one with a horizontal axis, and one with a vertical axis.
When we drag with the mouse, we then can rotate the underlying sphere so that the initial click location stays underneath the mouse.

<!-- markdownlint-disable MD033 -->

<div id='demo'></div>

> This was originally a [gist][gist] hosted at bl.ocks.org, which seems dead now. This [clone][clone] might still work.
{: .prompt-info }

[gist]: https://gist.github.com/patricksurry/5721459
[clone]: {{site.blocks_url}}/patricksurry/5721459

When the globe is oriented in its original location (i.e. rotation(0,0), with the north pole at the top of the page and the equator aligned with the horizontal canvas axis, it's easy, since D3's longitude rotation equals trackball rotation around the vertical axis, and the subsequently applied latitude rotation corresponds to trackball rotation around the horizontal axis.
But when the sphere is already rotated, it's not easy to infer what the combined rotation should be. Ideally we want a way of composing two rotations, but I'm not aware that you can do that currently in D3?  So I did some math (actually [SageMath][sagemath] did most of it for me) to work out the product of the original rotation matrix plus the new trackball motion, and derived an equivalent single rotation would be. This gives a more intuitive feel regardless of the position of the globe.
The annotated javascript implementation is repeated below.

[sagemath]: https://www.sagemath.org/

Compare with the [original example][original] I started from and see what happens when you first rotate the globe so the north pole is approximately facing you. Subsequent trackball movements then become completely non-intuitive.  You can reproduce the same behavior in the original source here by uncommenting one of the three behaviors in the mousemove() routine.

[original]: http://mbostock.github.io/d3/talk/20111018/azimuthal.html

<!-- markdownlint-disable MD018 MD037 MD052 -->

<style>
#demo svg {
    display: block;
    margin: 30px auto;
}
.globe {
    fill: lavender;
    stroke: #333;
}
</style>
<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="http://d3js.org/topojson.v1.min.js"></script>
<script>
var radius = 250;

var projection = d3.geo.orthographic()
    .scale(radius)
    .translate([radius, radius])
    .clipAngle(90);

var svg = d3.select("#demo").append("svg")
    .attr("width", radius * 2)
    .attr("height", radius * 2)
    .on("mousedown", mousedown)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

svg.append("circle")
    .attr('class', 'globe')
    .attr("cx", radius)
    .attr("cy", radius)
    .attr("r", radius);

var path = d3.geo.path()
    .projection(projection);

d3.json("/assets/data/world-countries.json", function(collection) {
  svg.selectAll("path")
      .data(collection.features)
    .enter().append("svg:path")
      .attr("d", path);
});

function trackballAngles(pt) {
  // based on http://www.opengl.org/wiki/Trackball
  // given a click at (x,y) in canvas coords on the globe (trackball),
  // calculate the spherical coordianates for the point as a rotation around
  // the vertical and horizontal axes

  var r = projection.scale();
  var c = projection.translate();
  var x = pt[0] - c[0], y = - (pt[1] - c[1]), ss = x*x + y*y;
  var z = r*r > 2 * ss ? Math.sqrt(r*r - ss) : r*r / 2 / Math.sqrt(ss);

  var lambda = Math.atan2(x, z) * 180 / Math.PI;
  var phi = Math.atan2(y, z) * 180 / Math.PI
  return [lambda, phi];
}

/*
This is the cartesian equivalent of the rotation matrix,
which is the product of the following rotations (in numbered order):
1. longitude: λ around the y axis (which points up in the canvas)
2. latitude: -ϕ around the x axis (which points right in the canvas)
3. yaw:       γ around the z axis (which points out of the screen)

NB.  If you measure rotations in a positive direction according to the right-hand rule
(point your right thumb in the positive direction of the rotation axis, and rotate in the
direction of your curled fingers), then the latitude rotation is negative.

R(λ, ϕ, γ) =
[[ sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ), −sin(γ)cos(ϕ), −sin(γ)sin(ϕ)cos(λ)+sin(λ)cos(γ)],
 [ −sin(λ)sin(ϕ)cos(γ)+sin(γ)cos(λ), cos(γ)cos(ϕ), sin(ϕ)cos(γ)cos(λ)+sin(γ)sin(λ)],
 [ −sin(λ)cos(ϕ),                    −sin(ϕ),       cos(λ)cos(ϕ)]]

If you then apply a "trackball rotation" of δλ around the y axis, and -δϕ around the
x axis, you get this horrible composite matrix:

R2(λ, ϕ, γ, δλ, δϕ) =
[[−sin(δλ)sin(λ)cos(ϕ)+(sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ))cos(δλ),
        −sin(γ)cos(δλ)cos(ϕ)−sin(δλ)sin(ϕ),
                sin(δλ)cos(λ)cos(ϕ)−(sin(γ)sin(ϕ)cos(λ)−sin(λ)cos(γ))cos(δλ)],
 [−sin(δϕ)sin(λ)cos(δλ)cos(ϕ)−(sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ))sin(δλ)sin(δϕ)−(sin(λ)sin(ϕ)cos(γ)−sin(γ)cos(λ))cos(δϕ),
        sin(δλ)sin(δϕ)sin(γ)cos(ϕ)−sin(δϕ)sin(ϕ)cos(δλ)+cos(δϕ)cos(γ)cos(ϕ),
                sin(δϕ)cos(δλ)cos(λ)cos(ϕ)+(sin(γ)sin(ϕ)cos(λ)−sin(λ)cos(γ))sin(δλ)sin(δϕ)+(sin(ϕ)cos(γ)cos(λ)+sin(γ)sin(λ))cos(δϕ)],
 [−sin(λ)cos(δλ)cos(δϕ)cos(ϕ)−(sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ))sin(δλ)cos(δϕ)+(sin(λ)sin(ϕ)cos(γ)−sin(γ)cos(λ))sin(δϕ),
        sin(δλ)sin(γ)cos(δϕ)cos(ϕ)−sin(δϕ)cos(γ)cos(ϕ)−sin(ϕ)cos(δλ)cos(δϕ),
                cos(δλ)cos(δϕ)cos(λ)cos(ϕ)+(sin(γ)sin(ϕ)cos(λ)−sin(λ)cos(γ))sin(δλ)cos(δϕ)−(sin(ϕ)cos(γ)cos(λ)+sin(γ)sin(λ))sin(δϕ)]]

by equating components of the matrics
(label them [[a00, a01, a02], [a10, a11, a12], [a20, a21, a22]])
we can find an equivalent rotation R(λ', ϕ', γ') == RC(λ, ϕ, γ, δλ, δϕ) :

if cos(ϕ') != 0:
 γ' = atan2(-RC01, RC11)
 ϕ' = atan2(-RC21, γ' == 0 ? RC11 / cos(γ') : - RC01 / sin(γ'))
 λ' = atan2(-RC20, RC22)
else:
 // when cos(ϕ') == 0, RC21 == - sin(ϕ') == +/- 1
 // the solution is degenerate, requiring just that
 //    γ' - λ' = atan2(RC00, RC10) if RC21 == -1 (ϕ' = π/2)
 // or γ' + λ' = atan2(RC00, RC10) if RC21 == 1 (ϕ' = -π/2)
 // so choose:
 γ' = atan2(RC10, RC00) - RC21 * λ
 ϕ' = - RC21 * π/2
 λ' = λ

*/

function composedRotation(λ, ϕ, γ, δλ, δϕ) {
    λ = Math.PI / 180 * λ;
    ϕ = Math.PI / 180 * ϕ;
    γ = Math.PI / 180 * γ;
    δλ = Math.PI / 180 * δλ;
    δϕ = Math.PI / 180 * δϕ;

    var sλ = Math.sin(λ), sϕ = Math.sin(ϕ), sγ = Math.sin(γ),
        sδλ = Math.sin(δλ), sδϕ = Math.sin(δϕ),
        cλ = Math.cos(λ), cϕ = Math.cos(ϕ), cγ = Math.cos(γ),
        cδλ = Math.cos(δλ), cδϕ = Math.cos(δϕ);

    var m00 = -sδλ * sλ * cϕ + (sγ * sλ * sϕ + cγ * cλ) * cδλ,
            m01 = -sγ * cδλ * cϕ - sδλ * sϕ,
                m02 = sδλ * cλ * cϕ - (sγ * sϕ * cλ - sλ * cγ) * cδλ,
        m10 = - sδϕ * sλ * cδλ * cϕ - (sγ * sλ * sϕ + cγ * cλ) * sδλ * sδϕ - (sλ * sϕ * cγ - sγ * cλ) * cδϕ,
            m11 = sδλ * sδϕ * sγ * cϕ - sδϕ * sϕ * cδλ + cδϕ * cγ * cϕ,
                 m12 = sδϕ * cδλ * cλ * cϕ + (sγ * sϕ * cλ - sλ * cγ) * sδλ * sδϕ + (sϕ * cγ * cλ + sγ * sλ) * cδϕ,
        m20 = - sλ * cδλ * cδϕ * cϕ - (sγ * sλ * sϕ + cγ * cλ) * sδλ * cδϕ + (sλ * sϕ * cγ - sγ * cλ) * sδϕ,
            m21 = sδλ * sγ * cδϕ * cϕ - sδϕ * cγ * cϕ - sϕ * cδλ * cδϕ,
                 m22 = cδλ * cδϕ * cλ * cϕ + (sγ * sϕ * cλ - sλ * cγ) * sδλ * cδϕ - (sϕ * cγ * cλ + sγ * sλ) * sδϕ;

    if (m01 != 0 || m11 != 0) {
         γ_ = Math.atan2(-m01, m11);
         ϕ_ = Math.atan2(-m21, Math.sin(γ_) == 0 ? m11 / Math.cos(γ_) : - m01 / Math.sin(γ_));
         λ_ = Math.atan2(-m20, m22);
    } else {
         γ_ = Math.atan2(m10, m00) - m21 * λ;
         ϕ_ = - m21 * Math.PI / 2;
         λ_ = λ;
    }

    return([λ_ * 180 / Math.PI, ϕ_ * 180 / Math.PI, γ_ * 180 / Math.PI]);
}

var m0 = null,
    o0;

function mousedown() {  // remember where the mouse was pressed, in canvas coords
  m0 = trackballAngles(d3.mouse(svg[0][0]));
  o0 = projection.rotate();
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {  // if mousedown
    var m1 = trackballAngles(d3.mouse(svg[0][0]));
    // we want to find rotate the current projection so that the point at m0 rotates to m1
    // along the great circle arc between them.
    // when the current projection is at rotation(0,0), with the north pole aligned
    // to the vertical canvas axis, and the equator aligned to the horizontal canvas
    // axis, this is easy to do, since D3's longitude rotation corresponds to trackball
    // rotation around the vertical axis, and then the subsequent latitude rotation
    // corresponds to the trackball rotation around the horizontal axis.
    // But if the current projection is already rotated, it's harder.
    // We need to find a new rotation equivalent to the composition of both

    // Choose one of these three update schemes:

    // Best behavior
    o1 = composedRotation(o0[0], o0[1], o0[2], m1[0] - m0[0], m1[1] - m0[1])

    // Improved behavior over original example
    //o1 = [o0[0] + (m1[0] - m0[0]), o0[1] + (m1[1] - m0[1])];

    // Original example from http://mbostock.github.io/d3/talk/20111018/azimuthal.html
    // o1 = [o0[0] - (m0[0] - m1[0]) / 8, o0[1] - (m1[1] - m0[1]) / 8];

    // move to the updated rotation
    projection.rotate(o1);

    // We can optionally update the "origin state" at each step.  This has the
    // advantage that each 'trackball movement' is small, but the disadvantage of
    // potentially accumulating many small drifts (you often see a twist creeping in
    // if you keep rolling the globe around with the mouse button down)
//    o0 = o1;
//    m0 = m1;

    svg.selectAll("path").attr("d", path);
  }
}

function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}
</script>

```js
function trackballAngles(pt) {
  // based on http://www.opengl.org/wiki/Trackball
  // given a click at (x,y) in canvas coords on the globe (trackball),
  // calculate the spherical coordianates for the point as a rotation around
  // the vertical and horizontal axes

  var r = projection.scale();
  var c = projection.translate();
  var x = pt[0] - c[0], y = - (pt[1] - c[1]), ss = x*x + y*y;
  var z = r*r > 2 * ss ? Math.sqrt(r*r - ss) : r*r / 2 / Math.sqrt(ss);

  var lambda = Math.atan2(x, z) * 180 / Math.PI;
  var phi = Math.atan2(y, z) * 180 / Math.PI
  return [lambda, phi];
}

/*
This is the cartesian equivalent of the rotation matrix,
which is the product of the following rotations (in numbered order):
1. longitude: λ around the y axis (which points up in the canvas)
2. latitude: -ϕ around the x axis (which points right in the canvas)
3. yaw:       γ around the z axis (which points out of the screen)

NB.  If you measure rotations in a positive direction according to the right-hand rule
(point your right thumb in the positive direction of the rotation axis, and rotate in the
direction of your curled fingers), then the latitude rotation is negative.

R(λ, ϕ, γ) =
[[ sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ), −sin(γ)cos(ϕ), −sin(γ)sin(ϕ)cos(λ)+sin(λ)cos(γ)],
 [ −sin(λ)sin(ϕ)cos(γ)+sin(γ)cos(λ), cos(γ)cos(ϕ), sin(ϕ)cos(γ)cos(λ)+sin(γ)sin(λ)],
 [ −sin(λ)cos(ϕ),                    −sin(ϕ),       cos(λ)cos(ϕ)]]

If you then apply a "trackball rotation" of δλ around the y axis, and -δϕ around the
x axis, you get this horrible composite matrix:

R2(λ, ϕ, γ, δλ, δϕ) =
[[−sin(δλ)sin(λ)cos(ϕ)+(sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ))cos(δλ),
        −sin(γ)cos(δλ)cos(ϕ)−sin(δλ)sin(ϕ),
                sin(δλ)cos(λ)cos(ϕ)−(sin(γ)sin(ϕ)cos(λ)−sin(λ)cos(γ))cos(δλ)],
 [−sin(δϕ)sin(λ)cos(δλ)cos(ϕ)−(sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ))sin(δλ)sin(δϕ)−(sin(λ)sin(ϕ)cos(γ)−sin(γ)cos(λ))cos(δϕ),
        sin(δλ)sin(δϕ)sin(γ)cos(ϕ)−sin(δϕ)sin(ϕ)cos(δλ)+cos(δϕ)cos(γ)cos(ϕ),
                sin(δϕ)cos(δλ)cos(λ)cos(ϕ)+(sin(γ)sin(ϕ)cos(λ)−sin(λ)cos(γ))sin(δλ)sin(δϕ)+(sin(ϕ)cos(γ)cos(λ)+sin(γ)sin(λ))cos(δϕ)],
 [−sin(λ)cos(δλ)cos(δϕ)cos(ϕ)−(sin(γ)sin(λ)sin(ϕ)+cos(γ)cos(λ))sin(δλ)cos(δϕ)+(sin(λ)sin(ϕ)cos(γ)−sin(γ)cos(λ))sin(δϕ),
        sin(δλ)sin(γ)cos(δϕ)cos(ϕ)−sin(δϕ)cos(γ)cos(ϕ)−sin(ϕ)cos(δλ)cos(δϕ),
                cos(δλ)cos(δϕ)cos(λ)cos(ϕ)+(sin(γ)sin(ϕ)cos(λ)−sin(λ)cos(γ))sin(δλ)cos(δϕ)−(sin(ϕ)cos(γ)cos(λ)+sin(γ)sin(λ))sin(δϕ)]]

by equating components of the matrics
(label them [[a00, a01, a02], [a10, a11, a12], [a20, a21, a22]])
we can find an equivalent rotation R(λ', ϕ', γ') == RC(λ, ϕ, γ, δλ, δϕ) :

if cos(ϕ') != 0:
 γ' = atan2(-RC01, RC11)
 ϕ' = atan2(-RC21, γ' == 0 ? RC11 / cos(γ') : - RC01 / sin(γ'))
 λ' = atan2(-RC20, RC22)
else:
 // when cos(ϕ') == 0, RC21 == - sin(ϕ') == +/- 1
 // the solution is degenerate, requiring just that
 //    γ' - λ' = atan2(RC00, RC10) if RC21 == -1 (ϕ' = π/2)
 // or γ' + λ' = atan2(RC00, RC10) if RC21 == 1 (ϕ' = -π/2)
 // so choose:
 γ' = atan2(RC10, RC00) - RC21 * λ
 ϕ' = - RC21 * π/2
 λ' = λ

*/

function composedRotation(λ, ϕ, γ, δλ, δϕ) {
    λ = Math.PI / 180 * λ;
    ϕ = Math.PI / 180 * ϕ;
    γ = Math.PI / 180 * γ;
    δλ = Math.PI / 180 * δλ;
    δϕ = Math.PI / 180 * δϕ;

    var sλ = Math.sin(λ), sϕ = Math.sin(ϕ), sγ = Math.sin(γ),
        sδλ = Math.sin(δλ), sδϕ = Math.sin(δϕ),
        cλ = Math.cos(λ), cϕ = Math.cos(ϕ), cγ = Math.cos(γ),
        cδλ = Math.cos(δλ), cδϕ = Math.cos(δϕ);

    var m00 = -sδλ * sλ * cϕ + (sγ * sλ * sϕ + cγ * cλ) * cδλ,
            m01 = -sγ * cδλ * cϕ - sδλ * sϕ,
                m02 = sδλ * cλ * cϕ - (sγ * sϕ * cλ - sλ * cγ) * cδλ,
        m10 = - sδϕ * sλ * cδλ * cϕ - (sγ * sλ * sϕ + cγ * cλ) * sδλ * sδϕ - (sλ * sϕ * cγ - sγ * cλ) * cδϕ,
            m11 = sδλ * sδϕ * sγ * cϕ - sδϕ * sϕ * cδλ + cδϕ * cγ * cϕ,
                 m12 = sδϕ * cδλ * cλ * cϕ + (sγ * sϕ * cλ - sλ * cγ) * sδλ * sδϕ + (sϕ * cγ * cλ + sγ * sλ) * cδϕ,
        m20 = - sλ * cδλ * cδϕ * cϕ - (sγ * sλ * sϕ + cγ * cλ) * sδλ * cδϕ + (sλ * sϕ * cγ - sγ * cλ) * sδϕ,
            m21 = sδλ * sγ * cδϕ * cϕ - sδϕ * cγ * cϕ - sϕ * cδλ * cδϕ,
                 m22 = cδλ * cδϕ * cλ * cϕ + (sγ * sϕ * cλ - sλ * cγ) * sδλ * cδϕ - (sϕ * cγ * cλ + sγ * sλ) * sδϕ;

    if (m01 != 0 || m11 != 0) {
         γ_ = Math.atan2(-m01, m11);
         ϕ_ = Math.atan2(-m21, Math.sin(γ_) == 0 ? m11 / Math.cos(γ_) : - m01 / Math.sin(γ_));
         λ_ = Math.atan2(-m20, m22);
    } else {
         γ_ = Math.atan2(m10, m00) - m21 * λ;
         ϕ_ = - m21 * Math.PI / 2;
         λ_ = λ;
    }

    return([λ_ * 180 / Math.PI, ϕ_ * 180 / Math.PI, γ_ * 180 / Math.PI]);
}

var m0 = null,
    o0;

function mousedown() {  // remember where the mouse was pressed, in canvas coords
  m0 = trackballAngles(d3.mouse(svg[0][0]));
  o0 = projection.rotate();
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {  // if mousedown
    var m1 = trackballAngles(d3.mouse(svg[0][0]));
    // we want to find rotate the current projection so that the point at m0 rotates to m1
    // along the great circle arc between them.
    // when the current projection is at rotation(0,0), with the north pole aligned
    // to the vertical canvas axis, and the equator aligned to the horizontal canvas
    // axis, this is easy to do, since D3's longitude rotation corresponds to trackball
    // rotation around the vertical axis, and then the subsequent latitude rotation
    // corresponds to the trackball rotation around the horizontal axis.
    // But if the current projection is already rotated, it's harder.
    // We need to find a new rotation equivalent to the composition of both

    // Choose one of these three update schemes:

    // Best behavior
    o1 = composedRotation(o0[0], o0[1], o0[2], m1[0] - m0[0], m1[1] - m0[1])

    // Improved behavior over original example
    //o1 = [o0[0] + (m1[0] - m0[0]), o0[1] + (m1[1] - m0[1])];

    // Original example from http://mbostock.github.io/d3/talk/20111018/azimuthal.html
    // o1 = [o0[0] - (m0[0] - m1[0]) / 8, o0[1] - (m1[1] - m0[1]) / 8];

    // move to the updated rotation
    projection.rotate(o1);

    // We can optionally update the "origin state" at each step.  This has the
    // advantage that each 'trackball movement' is small, but the disadvantage of
    // potentially accumulating many small drifts (you often see a twist creeping in
    // if you keep rolling the globe around with the mouse button down)
//    o0 = o1;
//    m0 = m1;

    svg.selectAll("path").attr("d", path);
  }
}
```
