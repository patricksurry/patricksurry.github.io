/*
The basic unit looks like this

     -y
      4
-x  3 1 0  +x
      2
     +y
*/
const 
// seven axial direction vectors including the nil direction 0,0 which form a megasquare of 5 squares
unitDirs = [
    { x: 0, y: 0 },
    { x: 1, y: 0 }, { x: 0, y: 1 },
    { x: -1, y: 0 }, { x: 0, y: -1 }, // proj = -2, -1  aka 3, 4 mod 5
], 
// lookup table to recover direction index when projecting (x, y) on (2, 1) mod 5
//    proj2dir = [0, 2, 1, 3, 4],
// the seven digits used to represent path offset within a 7hex unit, with '-' for -1, and '=' for -2 (double minus)
m5digits = '-0123', m5vals = [-1, 0, 1, 2, 3], 
// the repeating 5-hex path of mandelsnake visits dirs in this order in forward order
pos2dir = [1, 0, 2, 3, 4], // [4, 3, 2, 0, 1],
// the inverse mapping
dir2pos = [1, 0, 2, 3, 4], // [3, 4, 2, 1, 0],
// when we recurse, each unit of the curve gets rotated clockwise by rot steps
pos2rot = [3, 0, 3, 0, 2], // [2, 0, 3, 0, 3],
// we traverse some units in reverse order (-1)
// pos2sgn = [1, -1, 1, 1, -1];
pos2sgn = [-1, 1, -1, -1, 1];
function squareboundary({ x, y }) {
    return [
        { x: x + 0.5, y: y + 0.5 },
        { x: x + 0.5, y: y - 0.5 },
        { x: x - 0.5, y: y - 0.5 },
        { x: x - 0.5, y: y + 0.5 },
    ];
}
/*
    | 1  0 |     |  1  2 |
    | 0  1 |  => | -2  1 |
*/
function twist({ x, y }) {
    return { x: x + 2 * y, y: -2 * x + y };
}
/*
    |  1 -2 | / 5
    |  2  1 |
*/
function untwist({ x, y }) {
    return { x: (x - 2 * y) / 5, y: (2 * x + y) / 5 };
}
function inttom5(v) {
    // convert an integer to a base -5 string of m5 digits
    let s = '';
    v = -v;
    while (v != 0) {
        const tmp = v % 5, i = (tmp - m5vals[0] + 5) % 5;
        s = m5digits[i] + s;
        v = (v - m5vals[i]) / -5;
    }
    return s || '0';
}
function m5tomosaic(s) {
    // given an m5 index, get the corresponding point
    const ixs = s.split('').map(c => m5digits.indexOf(c));
    let n = 0, sgn = pos2sgn[dir2pos[0]], // implicit 0 was prior digit so get sense of central unit
    rot = 0; // (ixs.length - 1) % 4;
    ixs.forEach(i => {
        const pos = sgn < 0 ? 4 - i : i, d0 = pos2dir[pos], d = d0 ? ((d0 - 1 + rot) % 4 + 1) : 0;
        n = n * 5 + d;
        // if (s == '0') console.log(s, n.toString(5), `i ${i} sgn ${sgn} pos ${pos} rot ${rot} d0 ${d0} d ${d}`)
        rot = (rot /*- 1*/ + pos2rot[pos] + 4) % 4;
        sgn *= pos2sgn[pos];
    });
    return n;
}
function mosaictoxy(n) {
    let p = { x: 0, y: 0 };
    n.toString(5).split('').forEach(c => {
        p = twist(p);
        const { x, y } = unitDirs[+c];
        p = { x: p.x + x, y: p.y + y };
    });
    // console.log(s, n.toString(5), p);
    return p;
}
export { twist, untwist, inttom5, /*m5toint,*/ m5tomosaic, mosaictoxy, squareboundary };
