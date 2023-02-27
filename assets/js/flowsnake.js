const sqrt3 = Math.sqrt(3), 
// seven axial direction vectors including the nil direction 0,0 which form a megahex of 7 hexes
unitDirs = [
    { q: 0, r: 0 },
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
], unitVertices = [
    { q: 1 / 3, r: 1 / 3 }, { q: -1 / 3, r: 2 / 3 }, { q: -2 / 3, r: 1 / 3 },
    { q: -1 / 3, r: -1 / 3 }, { q: 1 / 3, r: -2 / 3 }, { q: 2 / 3, r: -1 / 3 },
], 
// ctrs = unitDirs.map(hextoxy),
// lookup table to recover direction index when projecting axial point (q, r) on (1, -2) mod 7
proj2dir = [0, 1, 5, 6, 3, 2, 4], 
// the seven digits used to represent path offset within a 7hex unit, with '-' for -1, and '=' for -2 (double minus)
g7digits = '=-01234', g7vals = [-2, -1, 0, 1, 2, 3, 4], 
// the repeating 7-hex path of Gospar curve visits dirs in this order in forward order
pos2dir = [2, 3, 0, 1, 6, 5, 4], 
// the inverse mapping
dir2pos = [2, 3, 0, 1, 6, 5, 4], 
// when we recurse, each unit of the Gospar curve gets rotated clockwise by rot steps
pos2rot = [0, 4, 0, 2, 0, 0, 2], 
// we traverse some units in reverse order (-1)
pos2sgn = [-1, 1, 1, -1, -1, -1, 1];
/*
     | 11   8   2 |
     |  2  11   8 |  / 3
     |  8   2  11 |
*/
function twist({ q, r }) {
    // rotates CCW by a little over 30deg and scales by sqrt(7)
    const s = -(q + r);
    return { q: (11 * q + 8 * r + 2 * s) / 3, r: (2 * q + 11 * r + 8 * s) / 3 };
}
/*
     |  5  -4   2 |
     |  2   5  -4 |  / 21
     | -4   2   5 |
*/
function untwist({ q, r }) {
    // invert twist, ie. reverses rotatation and scale by 1/sqrt(y)
    const s = -(q + r);
    return { q: (5 * q - 4 * r + 2 * s) / 21, r: (2 * q + 5 * r - 4 * s) / 21 };
}
function hextoshm(p) {
    // calculate a base-7 index for a hex using sprial honeycomb mosaic (shm) labeling
    // see https://gamedev.stackexchange.com/questions/71785/converting-between-spiral-honeycomb-mosaic-and-axial-hex-coordinates
    let n = 0;
    while (p.q || p.r) {
        // project onto (1,-2) to get the direction
        const proj = (p.q - 2 * p.r) % 7, d = proj2dir[proj < 0 ? proj + 7 : proj];
        n = n * 7 + d;
        // remove any offset...
        if (d) {
            const dir = unitDirs[d];
            p = { q: p.q - dir.q, r: p.r - dir.r };
        }
        // and scale down recursively
        p = untwist(p);
    }
    return n;
}
function shmtohex(n) {
    // return the hex corresponding to a shm-encoded integer
    let p = { q: 0, r: 0 };
    n.toString(7).split('').forEach(c => {
        p = twist(p);
        const { q, r } = unitDirs[+c];
        p = { q: p.q + q, r: p.r + r };
    });
    return p;
}
function inttog7(v) {
    // convert an integer to a base -7 string of g7 digits
    let s = '';
    v = -v;
    while (v != 0) {
        const tmp = v % 7, i = (tmp - g7vals[0] + 7) % 7;
        s = g7digits[i] + s;
        v = (v - g7vals[i]) / -7;
    }
    return s || '0';
}
function g7toint(s) {
    // convert a g7-encoded integer represented as a string over the digits =-01234 back to an integer
    let v = 0;
    s.split('').forEach(c => {
        const i = g7digits.indexOf(c);
        if (i == null)
            throw new Error(`Invalid character in g7 string ${s}`);
        v = -7 * v + g7vals[i];
    });
    return -v;
}
function shmtog7(n) {
    // given a SHM index, find the correspoding g7 index
    const ds = n.toString(7).split('').map(c => +c);
    let s = '', sgn = pos2sgn[dir2pos[0]], rot = (ds.length - 1) % 6;
    ds.forEach(d => {
        const pos = dir2pos[d ? ((d - 1 - rot + 6) % 6) + 1 : 0];
        s += g7digits[sgn < 0 ? 6 - pos : pos];
        rot = (rot - 1 + pos2rot[pos] + 6) % 6;
        sgn *= pos2sgn[pos];
    });
    return s || '0';
}
function g7toshm(s) {
    // given a g7 index, get the corresponding shm index
    const ixs = s.split('').map(c => g7digits.indexOf(c));
    let n = 0, sgn = pos2sgn[dir2pos[0]], // implicit 0 was prior digit so get sense of central unit
    rot = (ixs.length - 1) % 6;
    ixs.forEach(i => {
        const pos = sgn < 0 ? 6 - i : i, d0 = pos2dir[pos], d = d0 ? ((d0 - 1 + rot) % 6 + 1) : 0;
        n = n * 7 + d;
        rot = (rot - 1 + pos2rot[pos] + 6) % 6;
        sgn *= pos2sgn[pos];
    });
    return n;
}
function hexcenter({ q, r }, scale = 1) {
    // convert axial hex coordinate to hex center
    return {
        x: scale * sqrt3 * (q + r / 2),
        y: scale * 3 * r / 2,
    };
}
function hexboundary({ q, r }, scale = 1) {
    // return a CW boundary for given hex
    return unitVertices.map(({ q: vq, r: vr }) => hexcenter({ q: q + vq, r: r + vr }, scale));
}
export { hextoshm, shmtohex, inttog7, g7toint, shmtog7, g7toshm, hexcenter, hexboundary, unitDirs, unitVertices, twist, untwist, sqrt3, };
