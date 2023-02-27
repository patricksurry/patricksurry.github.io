---
layout: post
title:  "Taming the flowsnake and visualizing Covid proteins"
date:   2023-02-11
thumbnail: gosper.jpg
math: true
tags: math dataviz hexagons
---

<!-- markdownlint-disable MD033 -->

The [Gosper curve][gosperwiki] is a well-known space-filling curve.
It sports a dual form called a [flowsnake][flowsnake] which sequentially visits
every hexagon of an infinite lattice with no jumps or crossovers,
reminiscent of the [Hilbert][hilbert] curve on the Cartesian (square) grid.
Counting along the curve is a little slippery (it is a snake after all!)
but we'll show how counting in negative base 7 with an
unbalanced set of signed digits (`=, -, 0, 1, 2, 3, 4`)
makes it easy to convert back and forth between arbitrary points along the flowsnake
and corresponding hexagons.

[gosperwiki]: https://en.wikipedia.org/wiki/Gosper_curve
[flowsnake]: https://larryriddle.agnesscott.org/ifs/ksnow/flowsnake.htm
[hilbert]: https://en.wikipedia.org/wiki/Hilbert_curve

This enumeration is useful for compact visualization of one-dimensional sequence data
as well as indexing and compression of hexagonal data structures with good locality properties.
One example is this simple visualization of the [structural protein sequence for SARS-CoV-2][sarscov2]:

[sarscov2]: https://www.ncbi.nlm.nih.gov/nuccore/MN908947.3

<div id="covid19">
</div>
<div class=caption markdown=1>
A flowsnake visualization of the structural protein of Covid-19.
The amino acid sequence is centered around the origin,
with individual amino acids strung along the grey flowsnake path as colored beads,
based on a standard color palette.
The embedding induces a specific boundary shape based on the sequence length and initial offset,
with a compact "folding" reminiscent of (but of course completely unrelated to) protein folding,
which perhaps provides a useful visual fingerprint for the sequence.
</div>

<style>
    svg {
        display: block;
        margin: 0 auto;
    }
    #covid19 svg {
        margin: -50px 0;
    }
    text {
        stroke: none;
        fill: #333;
        font: 0.6px sans-serif;
        text-anchor: middle;
    }
    circle {
        stroke: none;
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
</style>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script type="module">
import {sqrt3, shmtohex, g7toshm, inttog7, hexcenter, hexboundary} from '/assets/js/flowsnake.js';
const
    // Amino acid color scheme inspired by https://www.bioinformatics.nl/~berndb/aacolour.html
    aminoColor = {
        A: 'limegreen',
        G: 'limegreen',
        C: 'olive',
        D: 'darkgreen',
        E: 'darkgreen',
        N: 'darkgreen',
        Q: 'darkgreen',
        I: 'royalblue',
        L: 'royalblue',
        M: 'royalblue',
        V: 'royalblue',
        F: 'mediumpurple',
        W: 'mediumpurple',
        Y: 'mediumpurple',
        H: 'mediumblue',
        K: 'orange',
        R: 'orange',
        P: 'hotpink',
        S: 'red',
        T: 'red',
        B: 'grey',
        Z: 'grey',
        X: 'grey',
        STOP: 'grey',
        START: 'grey',
    },
    // Covid 19 structural protein sequence data from https://www.ncbi.nlm.nih.gov/nuccore/MN908947.3
    covid19seq=`
        MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFR
        SSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIR
        GWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVY
        SSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQ
        GFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFL
        LKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITN
        LCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCF
        TNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYN
        YLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPY
        RVVVLSFELLHAPATVCGPKKSTNLVKNKCVNFNFNGLTGTGVLTESNKKFLPFQQFG
        RDIADTTDAVRDPQTLEILDITPCSFGGVSVITPGTNTSNQVAVLYQDVNCTEVPVAI
        HADQLTPTWRVYSTGSNVFQTRAGCLIGAEHVNNSYECDIPIGAGICASYQTQTNSPR
        RARSVASQSIIAYTMSLGAENSVAYSNNSIAIPTNFTISVTTEILPVSMTKTSVDCTM
        YICGDSTECSNLLLQYGSFCTQLNRALTGIAVEQDKNTQEVFAQVKQIYKTPPIKDFG
        GFNFSQILPDPSKPSKRSFIEDLLFNKVTLADAGFIKQYGDCLGDIAARDLICAQKFN
        GLTVLPPLLTDEMIAQYTSALLAGTITSGWTFGAGAALQIPFAMQMAYRFNGIGVTQN
        VLYENQKLIANQFNSAIGKIQDSLSSTASALGKLQDVVNQNAQALNTLVKQLSSNFGA
        ISSVLNDILSRLDKVEAEVQIDRLITGRLQSLQTYVTQQLIRAAEIRASANLAATKMS
        ECVLGQSKRVDFCGKGYHLMSFPQSAPHGVVFLHVTYVPAQEKNFTTAPAICHDGKAH
        FPREGVFVSNGTHWFVTQRNFYEPQIITTDNTFVSGNCDVVIGIVNNTVYDPLQPELD
        SFKEELDKYFKNHTSPDVDLGDISGINASVVNIQKEIDRLNEVAKNLNESLIDLQELG
        KYEQYIKWPWYIWLGFIAGLIAIVMVTIMLCCMTSCCSCLKGCCSCGSCCKFDEDDSE
        PVLKGVKLHYT`.trim().replace(/\s+/g, ''),
    // show half the sequence on each side of the origin
    start = -Math.floor(covid19seq.length/2),
    vs = covid19seq.split(''),
    ps = vs.map((_, i) => hexcenter(shmtohex(g7toshm(inttog7(start+i))))),
    scale = 1.1*Math.max(...ps.map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))),
    svg = d3.select('#covid19')
        .append('svg')
        .attr('width', 800)
        .attr('height', 600)
        .attr('viewBox', `-${scale} -${scale/2} ${2*scale} ${2*scale*3/4}`);
// display a line tracing the flowsnake enumeration of the amino acid sequence
svg.append('path')
    .attr('class', 'seq')
    .attr('d', d3.line(d => d.x, d => d.y)(ps));
// string circular beads along the flowsnake based on amino acid color
svg.append('g')
    .selectAll('circle')
    .data(ps)
    .join('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 1/sqrt3)
    .style('fill', (_, i) => aminoColor[vs[i]]);
</script>

I stumbled on this idea via a note in
Amit Patel's great [hexagonal grid reference][hexref].
He links a stackoverflow question about [spiral honeycomb mosaic (SHM) coordinates][shmq].
This is a system for enumerating an infinite hex grid.
We count in base 7 starting with the origin at 0,
and label its six immediate neighbors 1 through 6
to form a super-hex of seven individual hexagons.
We repeat the process to enumerate the six neighboring super-hexes
as the (base 7) tens, twenties and on through sixties
to form a super-super-hex of 7*7 = 49 individual hexagons,
and continue recursively (to infinity and beyond!).
In the posted solutions, Patel offers a nice approach for calculating the
index along the path for an arbitrary hexagon which we'll piggyback on.

![Spiral honeycomb mosaic coordinates](/assets/img/shm.png){: width="400px" }
<div class=caption markdown=1>
Spiral honeycomb mosaic (SHM) coordinates give a recursive enumeration of an infinite grid in base 7 (black numbers).  Patel's mapping to hexagon axial coordinates is shown with red digits.
</div>

[hexref]: https://www.redblobgames.com/grids/hexagons/
[shmq]: https://gamedev.stackexchange.com/questions/71785/converting-between-spiral-honeycomb-mosaic-and-axial-hex-coordinates

The SHM enumeration of the hex grid is straightforward,
but if we draw the path connecting sequential numbers
it gets a little tangled (below).
I wondered if there was a more compact approach where the
path had few (or no) crossovers, so that hexes with similar indices
on the path tended to be closer together.
There are a bunch of examples of such [space-filling curves][sfc] on the
normal Cartesian lattice including the [Hilbert curve][hilbert]
which is a more compact version of the more common [z-order curve][zorder].

<div id="shmpath"></div>
<div class=caption markdown=1>
The path connects hexes ordered by SHM coordinate starting at the origin.
As we see by the path and the rainbow color map over path offset,
we see tangling and jumps as we connect larger and larger hex modules.
The dotted red lines show how the unit vectors twist as the super-hex size
grows through $1, 7, 7^2, ...$.
</div>

<script type="module">
import {sqrt3, shmtohex, g7toshm, inttog7, hexcenter, hexboundary} from '/assets/js/flowsnake.js';
import {turboRGB} from '/assets/js/turbocmap.js';

const
    start = 0,
    end = parseInt('1000', 7),
    hs = [...Array(end).keys()].map(i => shmtohex(i)),
    ps = hs.map(h => hexcenter(h)),
    scale = 1.2*Math.max(...ps.map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))),
    svg = d3.select('#shmpath')
        .append('svg')
        .attr('width', 600)
        .attr('height', 600)
        .attr('viewBox', `-${scale} -${scale} ${2*scale} ${2*scale}`),
    line = d3.line(d => d.x, d => d.y),
    ohex = line(hexboundary({q: 0, r: 0}))+'Z',
    color = i => turboRGB(i/end),
    gs = svg.append('g')
        .selectAll('g')
        .data(ps)
        .join('g')
        .attr('class', 'hex')
        .attr('transform', p => `translate(${p.x}, ${p.y})`);

gs.append('path')
    .attr('d', ohex)
    .style('fill', (_, i) => color(i));
gs.append('text')
    .attr('dy', 0.6)
    .text((_, i) => i.toString(7))

svg.append('path')
    .attr('class', 'seq')
    .attr('d', line(ps));

svg.append('g')
    .attr('class', 'twist')
    .selectAll('path')
    .data([1, 7, 7*7])
    .join('path')
    .attr('d', d => line([{x: 0, y: 0}, hexcenter(shmtohex(d))]));
</script>

[sfc]: https://en.wikipedia.org/wiki/Space-filling_curve
[zorder]: https://en.wikipedia.org/wiki/Z-order_curve

While exploring Cartesian analogs, I came across the [Gosper curve][gosperwiki].
It has a hexagonal vibe but the repeating seven segment unit doesn't
immediately look like it maps nicely to a super-hex.

![Gosper curve motif](/assets/img/gosper-motif.jpg){: width="600px" }
<div class=caption markdown=1>
The Gosper curve is formed by a recurring motif of seven directed line segments ([source][newgosper]).
</div>

But it turns out there's a dual of the curve where each directed segment
can be associated with a hexagon to give the [flowsnake][flowsnake]:

![Flowsnake motif](/assets/img/flowsnake-motif.png){: width="200px" }
<div class=caption markdown=1>
The flowsnake is a dual view of the Gosper curve formed by
associating each directed segment with a hexagon,
yielding a recurring 2-shaped motif of seven hexagons ([source][flowsnake]).
</div>

[newgosper]: https://larryriddle.agnesscott.org/ifs/ksnow/flowsnake/new%20gosper%20space%20filling%20curves.pdf

Linking this motif following the same pattern, we
can recursively form a self-similar motif of hexes, super-hexes,
super-super-hexes and so on.
Here's a [hand-drawn sketch][gdraw] I put together to get to grips with the
recurrence:

[gdraw]: https://docs.google.com/drawings/d/1BH0VvdQjRt5qgwa20-JHuT2fY8ksMi4vNHfFiUQm1vY/edit

![Gosper recurrence](/assets/img/gosper-recur.jpg){: width="400px" }
<div class=caption markdown=1>
We can recursively trace a path through super-hex groupings of a central hex and their six neighbors.
The seven hex motif is traced by red segments, with seven of these super-hexes connected by blue segments to form a self-similar super-super-hex motif sketched in green.
Seven of these are connected with yellow segments to form another self-similar grouping and so on forever.
Note how the traversal direction through the motif flips at each level.
</div>

It seems obvious that we should be able to enumerate the points on the flowsnake
in a one-to-one correspondence to the SHM enumeration but how exactly?
The SHM labeling starts at the origin and extends outwards towards infinity,
but the flowsnake motif is double-ended.
If we naively start labeling in base 7 from one end of the repeating motif (below left),
then at each recursive step the zero point gets further and further from the origin.
The solution is to use a [signed digit representation][signeddigits]
where we count from -2 through 4 in base 7, leaving 0 at the center (below right).
For convenience
we'll write -2 as the `=` character (two minuses) and -1 as `-` (one minus).
Aside: if you want a little practice with this type of representation,
check out [this puzzle][aoc2225] from last year's Advent of Code.

[signeddigits]: https://en.wikipedia.org/wiki/Signed-digit_representation
[aoc2225]: https://adventofcode.com/2022/day/25

![Flowsnake motif](/assets/img/flowsnake-counting.png){: width="400px" }
<div class=caption markdown=1>
Counting with a signed representation lets us keep the origin pinned at the middle of the recurring
motif.  Using a negative base lets us cope with the change of direction with each level of recursion.
</div>

Unfortunately this still doesn't quite work,
since at each recursive step we traverse the seven hex motif
in the opposite direction.
At one level we want to count like -2, -1, 0, ... 4 and at the next like
-4, -3, ... 0, 1, 2.
In fact with the naive base 7 enumeration, the origin would end up at `2424242...` and recede off toward infinity.

One last trick gets us there: let's count in [negative base][negativebase] seven!
What?!  Starting from 0 we'll count like `0, 1, 2, 3, 4, 1=, 1- 10, 11, ...`
where a number like `=21` means $(-2)(-7)^2 + 2(-7) + 1 = -111$.
Conversely, for any integer we find its negative base 7 representation
by casting out remainders of 7 and flipping sign at each step.
For example $125 \pmod 7 \equiv 6 \equiv -1$ so the ones digit is `-`
with $125 - (-1) = -18 \times -7$ left over.
Then $-18 \pmod 7 \equiv 3$ with $-18 - 3 = 3 \times -7$ left over.
This gives the representation `33-`
which we read as 3 forty-nines plus 3 negative sevens plus a minus one
and indeed $3 (-7)^2 + 3 (-7) + (-1) = 125$.
Phew!

[negativebase]: https://en.wikipedia.org/wiki/Negative_base

<!--
[-3, -2, -1, 0, 1, 2, 3, 10, 100, 1000].forEach(i => {
    const g7 = inttog7(-i),
        shm = g7toshm(g7),
        hex = shmtohex(shm);
    console.log(i, g7, shm.toString(7), hex);
});
-->
```plaintext
 -idx       g7       shm         axial hex
----------------------------------------------
   -3        14        24     {q:   1, r:  1}
   -2         =         2     {q:   0, r:  1}
   -1         -         3     {q:  -1, r:  1}
    0         0         0     {q:   0, r:  0}
    1         1         1     {q:   1, r:  0}
    2         2         6     {q:   1, r: -1}
    3         3         5     {q:   0, r: -1}
   10        -3        43     {q:  -4, r:  3}
  100       202       216     {q:  12, r: -6}
 1000     1404-     51011     {q: -13, r: 35}
```
<div class=caption markdown=1>
A few examples illustrating conversion from an index value `idx` to the corresponding
`g7`, `shm` and axial hex coordinate.
Note we flip the `idx` sign so that `0` and `1` are common in all three systems.
The `g7` value ranges over all positive and negative integers written as digits `=-01234`,
`shm` is a non-negative integer written in base 7 with digits `0123456`,
and the axial hex coordinate uses Patel's cubical system.
</div>

Now we have all the ingredients to tame the flowsnake.
If you want the gory details here's the [enumeration code][enumcode],
but the end result is surprisingly simple (ignoring the painful journey there).
We can convert back and forth from an integer to its g7 (Gosper7) representation
with `inttog7` and `g7toint`.
Converting between g7 and SHM numbering is easy via `g7toshm` and `shmtog7`
and once we have a SHM coordinate we can find axial hex coordinates or vice versa
with `shmtohex` and `hextoshm`, all in $\mathcal{O}(\log_7 n)$ steps.
Once we can go back and forth between arbitrary flowsnake indices and hexagon locations
we're ready to experiment with data visualization and indexing or compressing
hexagonally structured data.

[enumcode]: https://gist.github.com/patricksurry/98faca3de0da1bc75d571a90f7ba3a34#file-flowsnake-ts

<div id="g7path"></div>
<div class=caption markdown=1>
Our flowsnake path connects hexes ordered by their G7 coordinate.
The origin is pinned at `0` with the path extending in both directions from there.
All the tangling and jumps from the SHM path have been removed,
and the color map over path index shows much nicer locality properties.
</div>

<script type="module">
import {sqrt3, shmtohex, g7toshm, inttog7, hexcenter, hexboundary} from '/assets/js/flowsnake.js';
import {turboRGB} from '/assets/js/turbocmap.js';

const
    start = parseInt('-424', 7),
    end = parseInt('242', 7),
    hs = [...Array(end-start+1).keys()].map(i => shmtohex(g7toshm(inttog7(start+i)))),
    ps = hs.map(h => hexcenter(h)),
    scale = 1.2*Math.max(...ps.map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))),
    svg = d3.select('#g7path')
        .append('svg')
        .attr('width', 600)
        .attr('height', 600)
        .attr('viewBox', `-${scale} -${scale} ${2*scale} ${2*scale}`),
    line = d3.line(d => d.x, d => d.y),
    ohex = line(hexboundary({q: 0, r: 0}))+'Z',
    color = i => turboRGB(i/ps.length),
    gs = svg.append('g')
        .selectAll('g')
        .data(ps)
        .join('g')
        .attr('class', 'hex')
        .attr('transform', p => `translate(${p.x}, ${p.y})`);

gs.append('path')
    .attr('d', ohex)
    .style('fill', (_, i) => color(i));
gs.append('text')
    .attr('dy', 0.6)
    .text((_, i) => inttog7(start+i))

svg.append('path')
    .attr('class', 'seq')
    .attr('d', line(ps));
</script>

<h3>More food for thought</h3>

My initial motivation was simple curiosity and a vague idea of
an efficient one-dimensional
enumeration of the infinite hexagonal grid
forming a
universal identifier for hex maps.
Although it's an elegant solution I'm not sure it's worth the effort in practice.
But as we know [hexagons are the bestagons][bestagons] so a number of other ideas
popped up as I struggled to make the enumeration code work:

[bestagons]: https://www.youtube.com/watch?v=thOifuHs6eY

- Can we quantify "nice locality properties"?
    It seems obvious that the flowsnake enumeration is better at assigning
    nearby hexes similar index values than SHM or a simple
    spiral enumeration from the origin, but it would be interesting to measure that.
    One approach seems to be choosing random compact hexagon regions
    and measuring the correlation between region size and index variance or number of index skips
    within the region.
    For example see [Analysis of the Clustering Properties of the Hilbert Space-Filling Curve][clustering].

[clustering]: https://www.cs.cmu.edu/~christos/PUBLICATIONS/ieee-tkde-hilbert.pdf

- Are there alternative flowsnake enumerations or different space-filling curves on hexagons?
    Kevin Ryde
    offers an interesting three-armed construction and enumeration
    of a flowsnake-like curve in his intriguing [planepath package][planepath].

[planepath]: https://metacpan.org/pod/Math::PlanePath::FlowsnakeCentres

- I also wondered: [is there a Cartesian analogue of the flowsnake?][analogue].
    Spoiler alert, yes.  I'll make a quick post about that soon.

[analogue]: https://math.stackexchange.com/questions/4638713/is-there-an-analogue-of-the-gosper-flowsnake-on-the-cartesian-lattice

- I don't really know anything about DNA sequence analysis or visualization.
    Is something like the Covid19 example above actually useful?
    There's a good survey of techniques in
    [Tasks, Techniques, and Tools for Genomic Data Visualization][genomicviz]
    including work on [High resolution visualization of genomic data][genomichilbert]
    with Hilbert curve which looks like it suffers from binary grid artifacts that
    might be ameliorated by a hexagonal grid.

[genomicviz]: https://arxiv.org/pdf/1905.02853.pdf
[genomichilbert]: https://github.com/jokergoo/HilbertCurve

- Are there other interesting sequential data visualization use cases?
    The canonical example is
    [Mapping the entire internet with Hilbert curves][internethilbert]
    but that actually seems to benefit from a binary segmentation given how
    IP addresses are constructed.
    Visualization of [rransformer models][transformers]
    and [recurrent neural networks][rnns] might be interesting to explore.

[internethilbert]: https://blog.benjojo.co.uk/post/scan-ping-the-internet-hilbert-curve
[transformers]: https://en.wikipedia.org/wiki/Transformer_(machine_learning_model)
[rnns]: https://en.wikipedia.org/wiki/Recurrent_neural_network

- Could we use recursive hexagonal partitioning as an alternative to
    traditional [geohashing][geohash] code which uses a z-order curve on latitude and longitude?
    The direct latitude/longitude projection means geohash squares are
    far from equal area as latitude changes.
    Could we use a geographic projection that results in roughly hexagonal shape
    like the equal-area [Eckert II][eckert2] projection and
    recursively subdivide with the flowsnake?
    There might be challenges with the recursive twisting of the tessellation, and
    the fact it doesn't generate a pure hexagon shape, but perhaps we could
    wrap the edges somehow to complete the sphere?
    See also Uber's [H3][H3] system representing the earth as a [spherical polyhedron][sphericalpoly] tiled with hexagons and a handful of strategically placed pentagons,
    and Google's [S2][S2] projection of the globe onto a cube of six connected Hilbert-curves.

[geohash]: https://en.wikipedia.org/wiki/Geohash
[eckert2]: https://en.wikipedia.org/wiki/Eckert_II_projection
[H3]: https://www.uber.com/en-CA/blog/h3/
[sphericalpoly]: https://en.wikipedia.org/wiki/Spherical_polyhedron
[S2]: https://s2geometry.io/resources/earthcube
