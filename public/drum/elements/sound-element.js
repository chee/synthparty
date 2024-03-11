import {partyElements, PartyElement} from "./party-elements.js"
import globalStyles from "./global-styles.js"
import Sound from "../sound.js"

export default class DelugeSound extends PartyElement {
	constructor() {
		super()
		this.shadowRoot.adoptedStyleSheets = [globalStyles]
		this.$("#audition").addEventListener("click", () => this.sound.audition())
		this.$("#browse").addEventListener("click", () =>
			this.announce("browse", this.sound.index)
		)
		this.$("#up").addEventListener("click", () =>
			this.announce("move-up", this.sound.index)
		)
		this.$("#down").addEventListener("click", () =>
			this.announce("move-down", this.sound.index)
		)
		this.$("#name").addEventListener(
			"input",
			event => (this.sound.name = event.target.value)
		)
		this.$("#kill").addEventListener("click", event => {
			this.sound.stop()
			this.announce("kill", this.sound.index)
		})
		this.$("#loop-mode").addEventListener("change", event => {
			this.sound.loopMode = event.target.value
		})
	}

	/** @type {Sound} */
	get sound() {
		return this.get("sound")
	}

	set sound(sound) {
		this.set("sound", sound, () => {
			this.$("#name").value = sound.name
			this.$("#audition").color = sound.color
			this.$("#loop-mode").value = sound.loopMode
		})
	}
}
partyElements.define("deluge-sound", DelugeSound)
