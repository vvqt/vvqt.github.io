import Scroller from "./scroller.js";

const urls = []
const series = {}
for (let i = 0; i < data.length; i++) {
    const splash = data[i].splash || "splash.png";
    urls.push(`${data[i].url}/${splash}`)

    if (CFG_USE_SERIES) {
        const serie = data[i].series
        if (serie) {
            if (series[serie]) {
                series[serie].end = i
            } else {
                series[serie] = {start: i, end: i}
            }
        }
    }
}

const NUM_URLS = urls.length;

const PaneSingleton_Shader = (gl) => {
    function _l(type, src) {
        //console.log(src);
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);

        return gl.getShaderParameter(s, gl.COMPILE_STATUS)
            ? s
            : (console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(s)}`, ) && null);
    }

    const p = gl.createProgram();
    const vs = _l(gl.VERTEX_SHADER,
        `#version 300 es
        precision highp float;
        in vec2 a_pos;
        in vec2 a_uv;
        
        
        out vec2 v_uv;
        //out vec3 v_mm;
        
        uniform vec4 u_pane;
        uniform vec2 u_screen;
        uniform float u_ar; // Texture aspect
        uniform float u_scroll;
        uniform float u_ofs; // Image n
        
        void main(void) {
            float tex_h = u_pane.y; // == pane_h
            float tex_w = u_pane.y * u_ar; // Texture width
            
            
            float panMax = u_pane[3];
            float gap = u_pane[2];
            
            vec2 scale = u_pane.xy;
            vec2 trans = (u_screen - scale) * 0.5; // p0
            trans.x += (u_pane.x + gap) * u_ofs;   // + offset
            trans.x -= u_scroll * panMax;          // - scroll
            
            vec2 wp = a_pos * scale + trans;
            vec2 np = (wp / u_screen) * 2.0 - vec2(1);
            gl_Position = vec4(np.xy, 0, 1);
            
            float t0 = (tex_w - u_pane.x) * 0.5;
            //float t1 = (tex_w + u_pane.x) * 0.5;
            float cx = (trans.x - (u_screen.x * 0.5)) / (panMax * 1.3);
            cx *= tex_w;
            t0 += cx;
            float t1 = t0 + u_pane.x;
            //t1 += cx;
            
            
            float tx = (t0 / tex_w) + (a_pos.x * ((t1-t0)/tex_w) );
            
            v_uv = vec2(tx, 1.0 - a_pos.y); 
        }`
    );


    const fs = _l(gl.FRAGMENT_SHADER,
        `#version 300 es
        precision highp float;
        
        in vec2 v_uv;
        //in vec3 v_mm;
        //in float v_ofs;
        uniform sampler2D u_tex;
        uniform bool u_switch;
        
        out vec4 fragCol;
        
        void main(void) {
            //fragCol = vec4(1, 1, 1, 1); //texture(u_tex, v_uv);
            if (u_switch)
                fragCol = texture(u_tex, v_uv * -1.0) * 0.9;
            else
                fragCol = texture(u_tex, v_uv) * 0.9;
        }`
    );

    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.getProgramParameter(p, gl.LINK_STATUS)
    || alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(p,)}`, );

    const vertices =
        new Float32Array([
            0, 0,
             1.0, 0.0,
            0.0,  1.0,

             1.0, 0.0,
             1.0,  1.0,
            0.0,  1.0
        ]);

    const uvs =
        new Float32Array([
            0, 1,
            1, 1,
            0, 0,

            1, 1,
            1, 0,
            0, 0,
        ])

    let offsets = []
    for (let i = 0; i < urls.length; ++i)
        offsets.push(i);


    const loc = (name) => gl.getAttribLocation(p, name);

    const VAO = gl.createVertexArray();
    const VBO = gl.createBuffer();
    const UVB = gl.createBuffer();
    // const iBO = gl.createBuffer();
    // const EBO = gl.createBuffer();

    gl.bindVertexArray(VAO);
    gl.enableVertexAttribArray(loc('a_pos'));

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(loc('a_pos'), 2, gl.FLOAT, false, 0, 0);


    // gl.enableVertexAttribArray(loc('a_uv'));
    // gl.bindBuffer(gl.ARRAY_BUFFER, UVB);
    // gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    // gl.vertexAttribPointer(loc('a_uv'), 2, gl.FLOAT, false, 0, 0);


    // gl.bindBuffer(gl.ARRAY_BUFFER, iBO);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(offsets), gl.STATIC_DRAW);
    // gl.enableVertexAttribArray(loc('a_ofs'));
    // gl.vertexAttribPointer(loc('a_ofs'), 1, gl.FLOAT, false, 0, 0);
    // gl.vertexAttribDivisor(1, 1);

    // gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32 * 2, 32 * 2);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return {
        program: p,
        VAO: VAO,
        VBO: VBO,
        UVB: UVB
    }
}

const PaneSingleton_Textures = (gl, images) => {
    let textures = [];
    let ratios = [];

    for (let i = 0; i < images.length; ++i) {
        let tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ratios[i] = images[i].width / images[i].height;
        textures.push(tex);
    }

    return {
        textures: textures,
        ratios: ratios
    }
}


class PaneSingleton {
    constructor(gl, images, div) {
        this.gl = gl;
        this.div = div;
        this.els = [];
        this.div_left0 = 0
        this.isDrawing = false;

        for (let i = 0, len = images.length; i < len; i++) {
            this.createPaneElement(i)
        }

        if (CFG_USE_SERIES) {
            this.series = []
            for (const [key, data] of Object.entries(series)) {
                this.createSerieElement(key, data.start, data.end);
            }
        }

        const shader = PaneSingleton_Shader(gl, images.length);

        this.shader = shader.program;
        this.VAO = shader.VAO;
        // this.VBO = shader.VBO;
        // this.UVB = shader.UVB;

        // this.uniforms = {
        //     'u_tex': gl.getUniformLocation(this.shader, 'u_tex'),
        // };

        let texData = PaneSingleton_Textures(gl, images);
        this.textures = texData.textures;
        this.ratios = texData.ratios;

        this.u_switch = false;
        this._scroll = 0;
    }

    createSerieElement(name, start, end) {
        const container = document.createElement("div");
        const line = document.createElement("div");
        const text = document.createElement("h2")
        container.setAttribute("class", "series_container")
        line.setAttribute("class", "series_line");
        text.setAttribute("class", "series_title");
        text.innerHTML = name;
        container.appendChild(line);
        container.appendChild(text);
        this.div.appendChild(container);
        this.series.push({el: container, start: start, end: end});
    }

    createPaneElement(i) {
        const link = document.createElement("a");
        const div = document.createElement("section");
        div.setAttribute("class", "pane_overlay");
        link.href = `/${data[i].url}`
        link.appendChild(div);
        this.div.appendChild(link);

        const title = data[i].title || null;
        const year = data[i].year || null;
        const material = data[i].material || null;

        const text_container = document.createElement("div");
        text_container.setAttribute("class", "work_text_container");
        //text_container.id = `work_text_container${i}`;
        div.appendChild(text_container);

        if (title) {
            const title_el = document.createElement("h2");
            title_el.innerHTML = title;
            title_el.setAttribute("class", "work_title");
            //title_el.id = `work_title${i}`;
            text_container.appendChild(title_el);
        }

        const info_container = document.createElement("span");
        info_container.setAttribute("class", "work_info_container");
        //info_container.id = "work_info_container";
        text_container.appendChild(info_container);

        if (material) {
            const material_el = document.createElement("h3");
            material_el.innerHTML = material + ".";
            material_el.setAttribute("class", "work_material");
            info_container.appendChild(material_el);
        }

        if (year) {
            const year_el = document.createElement("h3");
            year_el.innerHTML = year;// + (material != null ? "," : "" );
            year_el.setAttribute("class", "work_year");
            info_container.appendChild(year_el);
        }

        this.els.push(link)
    }

    setShowDomPanes(b) {
        this.div.style.display = b ? 'flex' : 'none';
    }

    resize(e) {
        this.uniform4f('u_pane', e.WIDTH, e.HEIGHT, e.GAP, e.MAX_PAN);
        this.uniform2f('u_screen', L.w, L.h);

        // Resize dom pane elements
        this.div.style.width = e.MAX_PAN + 'px'
        this.div.style.height = L.h + 'px'

        //(u_screen - scale) * 0.5;
        this.div_left0 = (L.w - e.WIDTH) * 0.5
        // this.div.style.left = (this.div_left0 - this._scroll) + 'px'
        this.div.style.left = this.div_left0 + 'px'
        this.div.style.transform = `translateX(${-this._scroll}px) translateZ(0.01px)`

        this.div.style.gap = e.GAP + 'px'
        this.div.querySelectorAll('a').forEach(child => {
            child.style.width = e.WIDTH + 'px'
            child.style.height = e.HEIGHT + 'px'
        })

        if (CFG_USE_SERIES) {
            const anchor_y = (L.h * 0.5) + (e.HEIGHT * 0.5);
            for (const serie of this.series) {
                const dist = (serie.end - serie.start) + 1
                const left = serie.start * (e.WIDTH + e.GAP)
                serie.el.style.width = ((e.WIDTH * dist) + (e.GAP * (dist - 1))) + 'px'
                serie.el.style.left = left + 'px'
                serie.el.style.top = anchor_y + 'px'
            }
        }
    }

    scroll(x) {
        this._scroll = x;
    }

    draw() {
        this.gl.clearColor(0.0666, 0.0666, 0.0666, 1.0);
        // Clear the color buffer with specified clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.shader);
        this.gl.bindVertexArray(this.VAO);

        this.gl.uniform1f(this.gl.getUniformLocation(this.shader, 'u_scroll'), this._scroll / L.pane.MAX_PAN);

        for (let i = 0; i < NUM_URLS; ++i) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
            this.gl.uniform1i(this.gl.getUniformLocation(this.shader, 'u_tex'), i);
            this.gl.uniform1f(this.gl.getUniformLocation(this.shader, 'u_ar'), this.ratios[i]);
            this.gl.uniform1f(this.gl.getUniformLocation(this.shader, 'u_ofs'), i);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
        // this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        // this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, NUM_URLS);

        // Update dom pane element scroll
        // const left0 = this.div_left0 - this._scroll
        // this.div.style.left = left0 + 'px'
        // this.div.style.transform = `translate3d(${-this._scroll}px,0,0)`
        this.div.style.transform = `translateX(${-this._scroll}px) translateZ(0.01px)`

        const cw = L.w * 0.5
        for (const el of this.els) {
            const rect = el.getBoundingClientRect();
            if (cw >= rect.left && cw <= rect.right) {
                el.style.opacity = '1';
            } else {
                el.style.opacity = null;
            }
        }
    }



    flip_switch() {
        this.gl.useProgram(this.shader);
        this.u_switch = !this.u_switch;
        this.gl.uniform1i(this.gl.getUniformLocation(this.shader, 'u_switch'), this.u_switch ? 1 : 0);
    }

    uniform2f(name, x, y) {
        this.gl.useProgram(this.shader);
        this.gl.uniform2f(this.gl.getUniformLocation(this.shader, name), x, y);
    }

    uniform1f(name, x) {
        this.gl.useProgram(this.shader);
        this.gl.uniform1f(this.gl.getUniformLocation(this.shader, name), x);
    }

    uniform4f(name, x, y, z, w) {
        this.gl.useProgram(this.shader);
        this.gl.uniform4f(this.gl.getUniformLocation(this.shader, name), x, y, z, w);
    }
}



let images = [];
let loading = urls.length;

function cb_loaded() {
    --loading;
    if (loading === 0)
        main(images);
}

for (let i = 0; i < urls.length; ++i) {
    let image = new Image();
    image.src = urls[i];
    image.onload = cb_loaded;
    images.push(image);
}

function main(images) {
    const cv = document.getElementById("glpanes");
    const div = document.getElementById("panes");
    const gl = cv.getContext("webgl2", {antialias: true, alpha: true});

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.",);
        return;
    }

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    const panes = new PaneSingleton(gl, images, div);


    // window.addEventListener('keyup', (e) => {
    //     if (e.key === 'f') {
    //         panes.flip_switch();
    //     }
    // })


    window.S = new Scroller((t, px) => {
        panes.scroll(px);
        render(t);
    }, () => panes.isDrawing = true, () => panes.isDrawing = false)

    //console.log(typeof S.anim);
    S.start();

    L.add('pane', (e) => {
        window.clearTimeout(e.timeoutID);
        // Hide dom panes while resizing since canvas gets stretched
        panes.setShowDomPanes(false);
        e.timeoutID = window.setTimeout(() => {
            e.AR = CFG_PANE_AR();
            e.MIN_WIDTH = CFG_PANE_MIN_WIDTH();
            e.MIN_HEIGHT = CFG_PANE_MIN_HEIGHT();
            e.WIDTH = Math.round(Math.max(e.MIN_WIDTH, e.MIN_HEIGHT * e.AR));
            e.HEIGHT = Math.round(e.WIDTH * (1 / e.AR));
            //e.GAP = Math.round(Math.max(vmin(3), 5));
            e.GAP = CFG_PANE_GAP();
            e.MAX_PAN = (e.WIDTH * NUM_URLS) + (e.GAP * (NUM_URLS - 1));

            panes.resize(e)
            panes.setShowDomPanes(true);

            S.max = e.MAX_PAN - (e.WIDTH);
            cv.width = L.w * CFG_SUPERSAMPLING_RATIO;
            cv.height = L.h * CFG_SUPERSAMPLING_RATIO;
            gl.viewport(0, 0, L.w * CFG_SUPERSAMPLING_RATIO, L.h * CFG_SUPERSAMPLING_RATIO);
            if (!panes.isDrawing) window.requestAnimationFrame(render);
        }, CFG_RESIZE_TIMEOUT);
        if (!panes.isDrawing) window.requestAnimationFrame(render);
    })


    let dt, lt;
    const render = (t) => {
        t *= 0.001; // convert to seconds
        dt = t - lt;
        lt = t;

        // Set clear color to black, fully opaque
        gl.clearColor(0.0666, 0.0666, 0.0666, 1.0);
        // Clear the color buffer with specified clear color
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        panes.draw();

        // requestAnimationFrame(render);
    }
    // window.requestAnimationFrame(render);


    L.flush();

}


