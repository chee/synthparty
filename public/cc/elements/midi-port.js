import {partyElements, PartyElement} from "./party-elements.js"

export default class MIDIPortElement extends PartyElement {
	#select = document.createElement("select")
	/** @type {MIDIAccess} */
	#midi
	/** @type {MIDIPort} */
	port = null
	direction = "input"

	constructor() {
		super()
		this.attachShadow({mode: "open"})
		let css = document.createElement("link")
		css.rel = "stylesheet"
		css.href = "/defaults.css"
		this.shadowRoot.append(css)
		this.shadowRoot.append(this.#select)
		this.#select.style.border = "2px solid"
		this.#select.style.background = "var(--fill)"
		this.#select.style.color = "var(--line)"
		this.#select.style.fontFamily = "var(--font-family)"
		this.#select.style.fontSize = "1rem"
		this.#select.style.width = "8em"
	}

	connectedCallback() {
		this.direction = this.getAttribute("direction")
		this.#select.addEventListener("change", this.#change)

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
		this.#select.removeEventListener("change", this.#change)
	}

	refreshDevices() {
		this.#select.textContent = ""
		let ports =
			this.direction == "input"
				? this.#midi.inputs.entries()
				: this.#midi.outputs.entries()
		this.ports = Object.fromEntries(ports)
		for (let portId in this.ports) {
			let option = document.createElement("option")
			option.value = portId
			let portName = this.ports[portId].name
			option.textContent = portName
			if (portName == "Deluge Port 1") {
				option.selected = true
			}
			this.#select.append(option)
		}
		this.#change()
	}

	/** @param {MIDIMessageEvent} event */
	#onmidimessage = event => {
		this.dispatchEvent(new MIDIMessageEvent(event.type, event))
	}

	#change = async () => {
		if (this.port) {
			this.port.removeEventListener("midimessage", this.#onmidimessage)
			this.port.close()
			this.port = null
		}

		let port = (this.port = this.ports[this.#select.value])

		if (port) {
			let device = await port.open()
			device.addEventListener("midimessage", this.#onmidimessage)
			this.announce(`midi${this.direction}device`, port)
		}
	}
}
partyElements.define("midi-device", MIDIPortElement)
