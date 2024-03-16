import * as elements from "./elements/init.js"
elements.init()

let midi = await navigator.requestMIDIAccess()
