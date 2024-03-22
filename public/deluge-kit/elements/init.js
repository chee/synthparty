import "./waveform-element.js"
import "./mix-element.js"
import "./button-element.js"
import "./kit-element.js"
import "./sound-element.js"
import "./midi-input.js"

import {partyElements} from "/elements/party-elements.js"

export function init() {
	partyElements.register()
}
