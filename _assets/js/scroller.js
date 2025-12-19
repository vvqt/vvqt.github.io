import {Ease, Util} from "./util.js";


export default class Scroller {
    constructor(cb, cbdown, cbup, useNativeScroll) {
        this.isNative = useNativeScroll;

        this.first = 0;
        this.curr = 0;
        this.prev = 0;
        this.targ = 0;
        this.targPrev = 0;
        this.timePrev = 0;
        this.isDrag =  false;
        this.min = 0;
        this.max = 0;
        this.MIN_MOVE_DELTA = 15;
        this.MIN_ANIM_DELTA = 0.01;
        this.RFR = 1000 / 60;

        this.cb = cb;
        this.cbdown = cbdown;
        this.cbup = cbup;

        this._down_cb = this.down.bind(this);
        this._up_cb = this.up.bind(this);
        this._move_cb = this.move.bind(this);
        this._anim_cb = this.anim.bind(this);
        this._wheel_cb = this.wheel.bind(this);
        this._click_cb = this.click.bind(this);
        this._ctx_cb = this.ctx.bind(this);

        this.isFF = Util.Snif.isFirefox;
        this.isAnim = false;
        this.isMove = false;
    }

    setScroll(px) {
        this.curr = px;
        this.prev = px;
        this.targ = px;
    }

    clamp(x) {
        return Math.round(Math.clamp(x, this.min, this.max));
    }

    move(e) {
        e.preventDefault();
        const x = e.pageX;
        if (Math.abs(x - this.first) >= this.MIN_MOVE_DELTA) {
            if (x > this.prev && this.targ === this.min) {
                this.prev -= (this.curr - this.targ) / 3;
            } else if (x < this.prev && this.targ === this.max) {
                this.prev += (this.curr - this.targ) / 3;
            }
            // if (x > this.prev && this.targ === this.min)
            //     this.first = x - (this.targPrev - this.min) / 3;
            // else if (x < this.prev && this.targ === this.max)
            //     this.first = x - (this.targPrev - this.max) / 3;

            this.targ += 3 * -(x - this.prev);
            this.targ = this.clamp(this.targ);
            this.prev = x;
            this.isMove = true;
        }
    }

    anim(t) {
        this.isAnim = true;
        if (this.isDrag || Math.abs(this.curr - this.targ) > this.MIN_ANIM_DELTA) {
            // console.log("anim");
            let fd = this.timePrev ? (t - this.timePrev) / this.RFR : 1;
            this.timePrev = t;
            // this.timePrev = this.timePrev || t;
            // const dt = t - this.timePrev;
            // this.timePrev = t;

            this.curr =  Ease.damp(this.curr, this.targ, CFG_DAMP_COEFFICIENT, fd);
            this.cb(t, this.curr);

            window.requestAnimationFrame((t) => this._anim_cb(t));
        } else {
            this.curr = this.targ;
            this.timePrev = 0;
            this.cb(t, this.curr);
            this.isAnim = false;
        }
    }

    down(e) {
        e.preventDefault()
        this.first = e.pageX;
        this.prev = e.pageX;

        this.isDrag = true;
        this.isMove = false;
        this.cbdown();

        this.raf();
        if (this.isNative) {
            addEventListener('mousemove', this._move_cb);
        } else {
            addEventListener('pointermove', this._move_cb);
        }
    }

    up(e) {
        if (this.isMove)
            e.preventDefault()
        this.isDrag = false;
        this.cbup();
        if (this.isNative) {
            removeEventListener('mousemove', this._move_cb);
        } else {
            removeEventListener('pointermove', this._move_cb);
        }
    }

    click(e) {
        // Prevent click on left mouse up if we have panned
        if (this.isMove)
            e.preventDefault()
    }

    ctx(e) {
        // Prevent context menu on right mouse up, if we have panned
        if (this.isMove)
            e.preventDefault()
    }



    start() {
        if (this.isNative) {
            // Let touch screens handle their own dragging when using native scrolling
            addEventListener('mousedown', this._down_cb)
            addEventListener('mouseup', this._up_cb)
        } else {
            addEventListener('pointerdown', this._down_cb);
            addEventListener('pointerup', this._up_cb);
        }

        addEventListener('click', this._click_cb);
        addEventListener('wheel', this._wheel_cb, {passive: false});
        // Disable right click context menu
        addEventListener('contextmenu', this._ctx_cb)
    }

    stop() {
        removeEventListener('pointerdown', this._down_cb);
        removeEventListener('pointerup', this._up_cb);
        removeEventListener('wheel', this._wheel_cb);
        this.up();
    }

    wheel(e) {
        if (!e.ctrlKey) {
            e.preventDefault();
            // const d = e.wheelDeltaY || -1 * e.deltaY;
            //console.log(e.deltaY, this.isFF, e.deltaMode);
            this.targ += (this.isFF) ? e.deltaY : e.deltaY * .75;
            this.targ = this.clamp(this.targ);
            this.raf();
        }
    }

    raf() {
        if (!this.isAnim)
            window.requestAnimationFrame(this._anim_cb);
    }


}


