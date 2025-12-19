"use strict";

Math.clamp = (x, mn, mx) => Math.min(Math.max(x, mn), mx);
Math.lerp = (a, b, t) => a + (b - a) * t;
Math.remap = (n, a0, a1, b0, b1) => Math.lerp(b0, b1, Math.clamp((n - a0) / (a1 - a0), 0, 1));

const Ease = {
    damp: (a, b, t, framedelta = 1) => Math.lerp(a, b, 1 - Math.exp(Math.log(1 - t) * framedelta)),

    linear: t => t,
    i1: t => 1 - Math.cos(t * (.5 * Math.PI)),
    o1: t => Math.sin(t * (.5 * Math.PI)),
    io1: t => -.5 * (Math.cos(Math.PI * t) - 1),
    i2: t => t * t,
    o2: t => t * (2 - t),
    io2: t => t < .5 ? 2 * t * t : (4 - 2 * t) * t - 1,
    i3: t => t * t * t,
    o3: t => --t * t * t + 1,
    io3: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    i4: t => t * t * t * t,
    o4: t => 1 - --t * t * t * t,
    io4: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
    i5: t => t * t * t * t * t,
    o5: t => 1 + --t * t * t * t * t,
    io5: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
    i6: t => 0 === t ? 0 : 2 ** (10 * (t - 1)),
    o6: t => 1 === t ? 1 : 1 - 2 ** (-10 * t),
    io6: t => 0 === t || 1 === t ? t : (t /= .5) < 1 ? .5 * 2 ** (10 * (t - 1)) : .5 * (2 - 2 ** (-10 * --t)),


    r0: (t, i) => 1 - 3 * i + 3 * t,
    r1: (t, i) => 3 * i - 6 * t,
    r2: (t, i, e) => ((Ease.r0(i, e) * t + Ease.r1(i, e)) * t + 3 * i) * t,
    r3: (t, i, e) => 3 * Ease.r0(i, e) * t * t + 2 * Ease.r1(i, e) * t + 3 * i,
    r4: (t, i, e, s, r) => {
        let a, h, o = 0;
        for (; h = i + .5 * (e - i),
                   0 < (a = Ease.r2(h, s, r) - t) ? e = h : i = h,
               1e-7 < Math.abs(a) && ++o < 10;) {
        }
        return h
    }
    ,
    r5: (i, e, s, r) => {
        for (let t = 0; t < 4; ++t) {
            var a = Ease.r3(e, s, r);
            if (0 === a)
                return e;
            e -= (Ease.r2(e, s, r) - i) / a
        }
        return e
    },
    Ease4: t => {
        const a = t[0]
            , i = t[1]
            , h = t[2]
            , e = t[3];
        let o = new Float32Array(11);
        if (a !== i || h !== e)
            for (let t = 0; t < 11; ++t)
                o[t] = Ease.r2(.1 * t, a, h);
        return t => a === i && h === e || (0 === t || 1 === t) ? t : Ease.r2(function (t) {
            let i = 0;
            for (var e = 1; 10 !== e && o[e] <= t; ++e)
                i += .1;
            --e;
            var s = (t - o[e]) / (o[e + 1] - o[e])
                , s = i + .1 * s
                , r = Ease.r3(s, a, h);
            return .001 <= r ? Ease.r5(t, s, a, h) : 0 === r ? s : Ease.r4(t, r, r + .1, a, h)
        }(t), i, e)
    }
}

const Util = {
    Is: {
        str: x => 'string' == typeof x,
        obj: x => x === Object(x),
        arr: x => x.constructor === Array,
        def: x => void 0 !== x,
        und: x => void 0 === x
    },
    Has: (x, prop) => x.hasOwnProperty(prop),
    clone: x => JSON.parse(JSON.stringify(x)),

    Fetch: i => {
        var t = "json" === i.type;
        const e = t ? "json" : "text";
        var s = {
            method: t ? "POST" : "GET",
            headers: new Headers({
                "Content-type": t ? "application/x-www-form-urlencoded" : "text/html"
            }),
            mode: "same-origin"
        };
        t && (s.body = i.body),
            fetch(i.url, s).then(t => {
                    if (t.ok)
                        return t[e]();
                    i.error && i.error()
                }
            ).then(t => {
                    i.success(t)
                }
            )
    },

    g: (t, i, e) => {
        return (t || document)["getElement" + i](e)
    },
    G: {
        id: (t, i) => Util.g(i, "ById", t),
        class: (t, i) => Util.g(i, "sByClassName", t),
        tag: (t, i) => Util.g(i, "sByTagName", t)
    },
    Select: {
        el: t => {
            let i = [];
            var e;
            return Util.Is.str(t) ? (e = t.substring(1),
                "#" === t.charAt(0) ? i[0] = Util.G.id(e) : i = Util.G.class(e)) : i[0] = t,
                i
        }
        ,
        type: t => "#" === t.charAt(0) ? "id" : "class",
        name: t => t.substring(1)
    },

    Snif: {
        uA: navigator.userAgent.toLowerCase(),
        get iPadIOS13() {
            return "MacIntel" === navigator.platform && 1 < navigator.maxTouchPoints
        },
        get isMobile() {
            return /mobi|android|tablet|ipad|iphone/.test(this.uA) || this.iPadIOS13
        },
        get isFirefox() {
            return -1 < this.uA.indexOf("firefox")
        }
    },
}

// export {Ease, Util}



