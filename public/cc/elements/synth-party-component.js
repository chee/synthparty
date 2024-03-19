import {closest} from "../lib/html.js"
import {PartyElement} from "./party-elements.js"
import SynthPartyApp from "./synth-party-app.js"

/** @abstract */
export default class SynthPartyComponent extends PartyElement {
	static DPI = 4
	disabled = false
	connectedCallback() {}
	disconnectCallback() {}
	/** @type {SynthPartyApp} */
	#party

	/** @return {SynthPartyApp} */
	get party() {
		if (!this.#party) {
			this.#party = closest(this, "synth-party")
		}
		return this.#party
	}
}
