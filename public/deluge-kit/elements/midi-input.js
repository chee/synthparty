import {partyElements, PartyElement} from "/elements/party-elements.js"

export default class MidiInput extends PartyElement {
	#select = document.createElement("select")
	/** @type {MIDIAccess} */
	#midi
	/** @type {MIDIInput} */
	input = null

	constructor() {
		super()
		this.attachShadow({mode: "open"})
		let css = document.createElement("link")
		css.rel = "stylesheet"
		css.href = "/defaults.css"
		this.shadowRoot.append(css)
		this.shadowRoot.append(this.#select)
		this.#select.style = `border: 2px solid; background: var(--fill); color: var(--cherries-dark); font-family: var(--font-family); font-size: 1rem; width: 8em`
	}

	connectedCallback() {
		this.#select.addEventListener("change", () => this.#change())
		navigator
			.requestMIDIAccess({
				software: this.truthy("software"),
				sysex: this.truthy("sysex")
			})
			.then(access => {
				this.#midi = access
				this.refreshDevices()
			})
	}

	disconnectedCallback() {
		// this.#select.removeEventListener("change", this.#change)
	}

	refreshDevices() {
		this.#select.textContent = ""
		this.inputs = Object.fromEntries(this.#midi.inputs.entries())
		for (let input in this.inputs) {
			let option = document.createElement("option")
			option.value = input
			option.textContent = this.inputs[input].name
			if (this.inputs[input].name == "Deluge Port 1") {
				option.selected = true
			}
			this.#select.append(option)
		}
		this.#change()
	}

	/** @param {MIDIMessageEvent} event */
	#onmidimessage(event) {
		this.dispatchEvent(new MIDIMessageEvent(event.type, event))
	}

	async #change() {
		if (this.input) {
			// this.input.removeEventListener("midimessage", this.#onmidimessage)
			this.input.close()
			this.input = null
		}

		let input = (this.input = this.inputs[this.#select.value])

		if (input) {
			let device = await input.open()
			device.addEventListener("midimessage", event =>
				this.#onmidimessage(event)
			)
		}
	}
}
partyElements.define("midi-input", MidiInput)
