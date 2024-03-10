import globalStyles from "./global-styles.js"
import {PartyElement, partyElements} from "./party-elements.js"

export default class DelugeKit extends PartyElement {
	#name = this.$("#name")
	constructor() {
		super()
		this.shadowRoot.adoptedStyleSheets = [globalStyles]
	}

	connectedCallback() {
		customElements.whenDefined("deluge-button").then(() => {
			this.$("#download").when("click", () =>
				this.announce("download", this.kit)
			)

			this.$("#add").addEventListener("click", () =>
				this.announce("add-sound", this.kit)
			)
		})
		this.sourcesElement = this.shadowRoot.querySelector("deluge-sources")
		this.#name.addEventListener("input", event =>
			this.announce("set-kit-name", event.target.value)
		)
		this.sourcesElement.addEventListener("set-name", event => {
			this.announce("set-sound-name", {
				index: event.target.index,
				name: event.detail
			})
		})
	}

	/** @type {import("../kit.js").default} */
	get kit() {
		return this.get("kit")
	}

	set kit(kit) {
		this.#name.value = kit.name

		while (kit.sounds.length < this.sourcesElement.children.length) {
			this.sourcesElement.lastElementChild.remove()
		}
		while (kit.sounds.length > this.sourcesElement.children.length) {
			/** @type {HTMLTemplateElement} */
			let soundTemplate = document.querySelector("template#sound")
			let soundElement = soundTemplate.content.cloneNode(true)
			this.sourcesElement.append(soundElement)
		}
		for (let [index, sound] of kit.sounds.entries()) {
			let el = /** @type {import("./sound-element.js").default} */ (
				this.sourcesElement.children[
					this.sourcesElement.children.length - 1 - index
				]
			)
			el.name = sound.name
			el.color = sound.color
		}
	}
}

partyElements.define("deluge-kit", DelugeKit)
