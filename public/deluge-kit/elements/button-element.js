import {partyElements, PartyElement} from "./party-elements.js"
import globalStyles from "./global-styles.js"

export default class DelugeButton extends PartyElement {
	#button = document.createElement("button")

	constructor() {
		super()
		this.attachShadow({mode: "open"})
		this.shadowRoot.appendChild(this.#button)
		this.#button.textContent = this.getAttribute("label")
		this.shadowRoot.adoptedStyleSheets = [globalStyles]
		this.#button.id = this.id
		this.#button.style.background = this.color
	}

	set label(val) {
		this.set("label", val, () => {
			this.setAttribute("label", val)
			this.#button.textContent = this.label
		})
	}

	/** @type string */
	get label() {
		return this.get("label")
	}

	/** @type string */
	get color() {
		return this.get("color")
	}

	set color(val) {
		this.set("color", val, () => {
			this.#button.style.background = this.color
		})
	}
}
partyElements.define("deluge-button", DelugeButton)
