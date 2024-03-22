import {closest} from "../lib/html.js"
import {PartyElement} from "/elements/party-elements.js"
import SynthPartyApp from "./synth-party-app.js"

/**
 * @abstract
 * @template {import("/elements/party-elements.js").PartyEventMap} E
 * @extends {PartyElement<E>}
 */
export default class SynthPartyComponent extends PartyElement {
	static DPI = 4
	disabled = false
	connectedCallback() {}
	disconnectCallback() {}
	/** @type {SynthPartyApp|null} */
	#party = null

	/** @return {SynthPartyApp|null} */
	get party() {
		if (!this.#party) {
			this.#party = closest(this, "synth-party")
		}

		return this.#party
	}
}
