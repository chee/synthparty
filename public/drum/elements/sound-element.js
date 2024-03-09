import {partyElements, PartyElement} from "./party-elements.js"
import globalStyles from "./global-styles.js"
import rand from "../lib/rand.js"
import colours from "../lib/colours.js"

export default class DelugeSound extends PartyElement {
	constructor() {
		super()
		this.shadowRoot.adoptedStyleSheets = [globalStyles]
		this.$("#audition").addEventListener("click", () =>
			this.announce("audition", this.index)
		)
		this.$("#browse").addEventListener("click", () =>
			this.announce("browse", this.index)
		)
		this.$("#up").addEventListener("click", () =>
			this.announce("move-up", this.index)
		)
		this.$("#down").addEventListener("click", () =>
			this.announce("move-down", this.index)
		)
		this.$("#name").addEventListener("input", event =>
			this.announce("set-name", event.target.value)
		)
	}

	get index() {
		return Array.from(this.parentElement.children).indexOf(this)
	}

	/** @type {string} */
	get name() {
		return this.get("name")
	}

	set name(name) {
		this.set("name", name, () => {
			this.$("#name").value = name
		})
	}

	/** @type {string} */
	get color() {
		return this.get("color")
	}

	set color(color) {
		this.set("color", color, () => {
			this.$("#audition").color = color
		})
	}
}
partyElements.define("deluge-sound", DelugeSound)
