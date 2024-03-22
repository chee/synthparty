import {partyElements, PartyElement} from "/elements/party-elements.js"
import Sound from "../sound.js"

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
		this.$("#loop-mode").addEventListener("change", event => {
			this.sound.loopMode = event.target.value
		})
		this.$("#polyphonic").addEventListener("change", event => {
			this.sound.polyphonic = event.target.value
		})
		this.$("#reversed").addEventListener("change", event => {
			this.sound.reversed = event.target.checked
			this.$(`deluge-${this.sound.editorMode}`).draw()
		})
		this.$("#sidechain-send").addEventListener("change", event => {
			this.sound.sidechainSend = event.target.checked
		})
		this.$("#linear-interpolation").addEventListener("change", event => {
			this.sound.linearInterpolation = event.target.checked
		})
		this.$("#time-stretch").addEventListener("change", event => {
			this.sound.timeStretch = event.target.checked
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
		this.$("#loop-mode").value = sound.loopMode
		this.$("#polyphonic").value = sound.polyphonic
		this.$("#reversed").checked = sound.reversed
		this.$("#sidechain-send").checked = sound.sidechainSend
		this.$("#linear-interpolation").checked = sound.linearInterpolation
		this.$("#time-stretch").checked = sound.timeStretch
		this.$("#slot").textContent = sound.index.toString().padStart(3, "0")
		this.$("deluge-waveform").sound = sound
		this.$("deluge-mix").sound = sound
		this.$("deluge-envelope").sound = sound
	}
}
partyElements.define("deluge-sound", DelugeSound)
