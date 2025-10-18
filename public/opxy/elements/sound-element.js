import {PartyElement, partyElements} from "/elements/party-elements.js"
import Sound from "../sound.js"
import {stdLayout} from "../sound.js"

export default class DelugeSound extends PartyElement {
	/** @type Sound */
	#sound

	constructor() {
		super()
		this.$("#audition").addEventListener("click", () => {
			this.announce("audition")
		})
		this.$("#audition").addEventListener("mousedown", () => {
			this.sound.noteOn()
			window.addEventListener(
				"mouseup",
				() => {
					this.sound.noteOff()
				},
				{once: true}
			)
		})
		this.$("#waveform").addEventListener("click", () => {
			this.sound.editorMode = "waveform"
			this.sound = this.sound
		})
		this.$("#mix").addEventListener("click", () => {
			this.sound.editorMode = "mix"
			this.sound = this.sound
		})
		this.$("#browse").addEventListener("click", async () => {
			let [sound] = await Sound.browse({
				multiple: false
			})
			this.sound.replace(sound)
		})

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
		this.$("#playmode").addEventListener("change", event => {
			this.sound.playmode = event.target.value
		})

		this.$("#reverse").addEventListener("change", event => {
			this.sound.reverse = event.target.checked
			this.$(`deluge-${this.sound.editorMode}`).draw()
		})
	}

	/** @type {Sound} */
	get sound() {
		return this.#sound
	}

	set sound(sound) {
		this.#sound = sound
		this.$("#name").value = sound.name
		this.$("#audition").style.background = sound.color
		this.style.border = `1px solid ${sound.color}`
		this.style.setProperty("--sound-color", sound.color)
		this.setAttribute("editor", sound.editorMode)
		this.$("#playmode").value = sound.playmode
		this.$("#reverse").checked = sound.reverse
		this.$("#midi").textContent = sound.notename + sound.hikey
		this.$("#slot").textContent = stdLayout[sound.index] ?? "BEYOND THE END"
		this.$("deluge-waveform").sound = sound
		this.$("deluge-mix").sound = sound
		this.$("deluge-envelope").sound = sound
		this.dataset.over = this.sound.over
	}
}
partyElements.define("deluge-sound", DelugeSound)
