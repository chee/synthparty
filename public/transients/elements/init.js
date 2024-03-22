import "./sample-element.js"
import "/elements/midi-port.js"

import {partyElements} from "/elements/party-elements.js"

export function init() {
	partyElements.register()
}
