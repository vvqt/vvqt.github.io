// These are lambdas because vmax(), vh() have to be evaluated after layout is set up
const CFG_PANE_AR = () => 9/16
const CFG_PANE_MIN_WIDTH = () => vmax(10)
const CFG_PANE_MIN_HEIGHT = () => vh(70)
const CFG_PANE_GAP = () => vmin(2)

const CFG_SUPERSAMPLING_RATIO = 1
const CFG_RESIZE_TIMEOUT = 300

const CFG_USE_SERIES = true

// Motion
const CFG_DAMP_COEFFICIENT = 0.083
