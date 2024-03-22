import {partyElements, PartyElement} from "/elements/party-elements.js"

/**
 * @typedef {{
	"midiinputdevice": MIDIInput
	"midioutputdevice": MIDIOutput
 }} MIDIPortElementEventMap
 */

/**
 * @extends {PartyElement<MIDIPortElementEventMap>}
 */
export default class MIDIPortElement extends PartyElement {
	#select = document.createElement("select")
	/** @type {MIDIAccess?} */
	#midi = null
	/** @type {(MIDIInput | MIDIOutput)?} */
	port = null
	/** @type {"input" | "output"} */
	direction = /** @type {const} */ ("input")
	/** @type {Record<string, MIDIPort>}*/
	ports = {}

	constructor() {
		super()
		this.attachShadow({mode: "open"})
		let css = document.createElement("link")
		css.rel = "stylesheet"
		css.href = "/defaults.css"
		let shadowRoot = /** @type {ShadowRoot} */ (this.shadowRoot)
		shadowRoot.append(css)
		shadowRoot.append(this.#select)
		this.#select.style.border = "2px solid"
		this.#select.style.background = "var(--fill)"
		this.#select.style.color = "var(--line)"
		this.#select.style.fontFamily = "var(--font-family)"
		this.#select.style.fontSize = "1rem"
		this.#select.style.width = "8em"
	}

	connectedCallback() {
		this.direction =
			this.getAttribute("direction") == "input" ? "input" : "output"
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
				? this.#midi?.inputs.entries()
				: this.#midi?.outputs.entries()
		if (!ports) {
			console.error("no midi devices")
			return
		}
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

	/** @param {MIDIMessageEvent & MIDIMessageEventInit} event */
	#onmidimessage = event => {
		this.dispatchEvent(new MIDIMessageEvent(event.type, event))
	}

	#change = async () => {
		if (this.port) {
			this.port.removeEventListener(
				"midimessage",
				// @ts-ignore
				this.#onmidimessage
			)
			this.port.close()
			this.port = null
		}

		if (this.direction == "input") {
			this.port = /** @type {MIDIInput} */ (this.ports[this.#select.value])
		} else {
			this.port = /** @type {MIDIOutput} */ (this.ports[this.#select.value])
		}
		let port = this.port

		if (port) {
			await port.open()
			port.addEventListener(
				"midimessage",
				// @ts-ignore
				this.#onmidimessage
			)
			this.announce(`midi${this.direction}device`, port)
		}
	}
}
partyElements.define("midi-port", MIDIPortElement)
