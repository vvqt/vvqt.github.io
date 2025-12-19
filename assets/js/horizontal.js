// import Scroller from "./scroller.js";

addEventListener("load", (event) => {
    const main = document.getElementById("horizontal");
    const load = document.getElementById("loading");

    // Disable progressive scrolling
    // main.style.overflow = "visible";

    let currentScrollWidth = main.scrollWidth;
    let currentInnerWidth = window.innerWidth;

    function scroll(px) {
        // main.style.transform = `translateX(${-px}px) translateZ(0.00001px)`
        // main.scrollLeft = px;

        main.scrollTo({
            top: 0,
            left: px,
            behavior: "instant"
        })
    }

    function resize() {
        //const rect = main.getBoundingClientRect();


        if (S.max === 0) {
            // Recover saved scroll on reload / nav
            currentScrollWidth = main.scrollWidth;
            currentInnerWidth = window.innerWidth;
            S.max = currentScrollWidth - currentInnerWidth;
            S.setScroll(main.scrollLeft);
        } else if (S.curr === S.max && window.innerWidth > currentInnerWidth && main.scrollWidth > currentInnerWidth) {
            // Fix weird resize behavior on FF, when page is resized larger while at 100% scroll,
            // the element is artificially widened until user has scrolled back into range,
            // causing scrollers max to be beyond the page
            currentInnerWidth = window.innerWidth;
            S.max = currentScrollWidth - currentInnerWidth;
            S.setScroll(S.max)
            main.scrollTo({
                top: 0,
                left: S.max,
                behavior: "instant"
            })
        } else {
            currentScrollWidth = main.scrollWidth;
            currentInnerWidth = window.innerWidth;
            S.max = currentScrollWidth - currentInnerWidth;
            S.setScroll(main.scrollLeft);
        }

        // S.max = main.scrollWidth - window.innerWidth;

        // console.log(currentInnerWidth, currentScrollWidth);
    }

    window.S = new Scroller((t, px) => {scroll(px);}, () => {}, () => {}, true)


    addEventListener("resize", resize);
    resize();
    S.start();
    // window.setTimeout(() => {
    //     // resize();
    //     S.start();
    // }, 500)

    // resize();
    // // S.setScroll(main.scrollLeft)
    // S.start();
})