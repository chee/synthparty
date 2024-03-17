import {closest} from "../lib/html.js"
import {PartyElement} from "./party-elements.js"
import SynthPartyApp from "./synth-party-app.js"

/** @abstract */
export default class SynthPartyComponent extends PartyElement {
	static DPI = 4
	disabled = false
	/** @type {number} */
	#clock

	connectedCallback() {
		this.#clock = window.setInterval(() => this.tick(), 4)
	}

	disconnectCallback() {
		clearInterval(this.#clock)
	}

	tick() {}

	/** @type {SynthPartyApp} */
	#party

	get audioContext() {
		return this.party.audioContext
	}

	/** @return {SynthPartyApp} */
	get party() {
		if (!this.#party) {
			this.#party = closest(this, "synth-party")
		}
		return this.#party
	}
}
