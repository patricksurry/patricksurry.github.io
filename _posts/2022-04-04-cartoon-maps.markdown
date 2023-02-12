---
layout: post
title:  "Cartoon maps"
date:   2022-04-04
thumbnail: cartoon-map.jpg
tags: d3 maps dataviz
---

<!-- markdownlint-disable MD033 -->

A quick visualization experiment to create an informal / cartoonish map
reminiscent of the game of *Risk*.

> This was originally a [gist][gist] hosted at bl.ocks.org, which seems dead now. This [clone][clone] might still work.
{: .prompt-info }

[gist]: https://gist.github.com/patricksurry/e9b91eed27bb2eacd379777a050df9d2
[clone]: https://blocks.roadtolarissa.com/patricksurry/e9b91eed27bb2eacd379777a050df9d2

<div id='demo'></div>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap" rel="stylesheet">

<style>
#demo {
  font-family: 'Architects Daughter', cursive;
  font-size: 16pt;
  margin: 0;
}
svg {
  border:  1px solid #666;
}
.country {
  stroke-width: 8;
  stroke-linejoin: round;
  fill-opacity: 0.33;
}
.city path{
  fill:  #33;
}
.country text {
  font-size: 120%;
}
text {
  fill: #666;
  fill-opacity: 1;
  stroke: none;
  text-anchor: middle;
}
</style>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
var width = 1024,
    height = 600;

var svg = d3.select("#demo").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("filter")
    .attr("id", "blur")
    .append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 4);

var defs = svg.append("defs");

Promise.all([
  d3.json("https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson"),
  d3.json("https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_populated_places_simple.geojson"),
]).then(
function([countrygeo, citygeo]) {
    let
      cities = citygeo.features.filter(d =>
          d.megacity || d.properties.scalerank <= 2
        ),
      a3s = cities.map(d => d.properties.adm0_a3),
      countries = countrygeo.features //.filter(d => a3s.includes(d.properties.adm0_a3));

    var projection = d3.geoEqualEarth()
        .fitSize([width, height], {type: 'FeatureCollection', features: countries})
        .center([20, 45])
        .scale(width)

    var path = d3.geoPath()
        .projection(projection);

    defs.selectAll("path")
        .data(countries)
      .enter().append("path")
        .attr("id", d => d.properties.adm0_a3)
        .attr("d", path)

    defs.selectAll("clipPath")
        .data(countries)
      .enter().append("clipPath")
        .attr("id", d => "inside-" + d.properties.adm0_a3)
        .append("use")
        .attr("xlink:href", d => "#" + d.properties.adm0_a3)

    let shapes = svg.append('g')
        .attr("class", "countries")
        .selectAll('.country')
        .data(countries)
      .enter().append('g')
        .attr("class", "country");

    shapes
        .append("use")
        .attr("xlink:href", d => "#" + d.properties.adm0_a3)
        .attr("clip-path", d => `url(#inside-${d.properties.adm0_a3})`)
        .attr("filter", "url(#blur)")
        .style("stroke", d => d3.schemeTableau10[d.properties.mapcolor7])
        .style("fill", d => d3.schemeTableau10[d.properties.mapcolor7]);

    let dots = svg.append('g')
        .attr("class", "cities")
        .selectAll(".city")
        .data(cities)
      .enter().append("g")
        .attr("class", "city")
        .attr('transform', d => {
          let [x, y] = projection(d.geometry.coordinates);
          return `translate(${x}, ${y})`;
        })
        .datum(d => d.properties);
    dots.append('path')
      .attr("d", d => d3.symbol(d.adm0cap ? d3.symbolStar: d3.symbolCircle, 2*(3 - Math.sqrt(d.scalerank)))());
    dots.append('text')
      .attr('dy', -2)
      .attr('font-size', d => (100-(1-d.adm0cap)*d.scalerank*10) + '%')
      .text(d => d.name);
});
</script>
