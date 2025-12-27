---
layout: post
title:  "Omega Speedmaster Demo"
date:   2021-08-26
thumbnail: speedmaster.png
tags: g3 gauges dataviz
---

Did I mention I got obsessed with gauges?
I reconstructed the iconic [Omega Speedmaster watch][speedmaster]
using my [G3][g3] toolkit as an illustration
of its flexibility to create complex, working gauges that look good.

[g3]: https://github.com/patricksurry/g3
[speedmaster]: https://en.wikipedia.org/wiki/Omega_Speedmaster

<!-- markdownlint-disable MD011 MD033 -->

<div id='demo'></div>

<script src="https://unpkg.com/@patricksurry/g3/dist/g3-contrib.min.js"></script>

<script>
g3.panel()
  .width(500).height(500)
  .append(
    g3.put().x(250).y(250).scale(2).append(
      g3.contrib.clocks.omegaSpeedmaster()
    )
  )('#demo');
// hack to fix image url
document.getElementsByTagName('image')[0].href.baseVal = '/assets/img/speedmaster_logo.png';
</script>
