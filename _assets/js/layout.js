class LayoutSingleton {
    constructor() {
        this.w = undefined;
        this.h = undefined;
        this._el = {};

        this._resize = () => {
            this.w = $(window).width();
            this.h = $(window).height();
            for (let el in this._el)
                this._el[el]();
        }

        $(document).ready(() => {
            this._resize();
            $(window).on('resize', this._resize);
        })
    }

    add(name, cb) {
        this[name] = {};
        this._el[name] = () => {
            cb(this[name]);
        }
        // if (this.w) this._el[name]();
    }

    flush() {
        this._resize();
    }
}

const L = new LayoutSingleton();

const vw = n => (n/100) * L.w,
      vh = n => (n/100) * L.h,
    vmin = n => (n/100) * Math.min(L.w, L.h),
    vmax = n => (n/100) * Math.max(L.w, L.h);
