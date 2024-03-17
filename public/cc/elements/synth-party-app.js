import {PartyElement, partyElements} from "./party-elements.js"

/** @abstract */
export default class SynthPartyApp extends PartyElement {
	audioContext = new AudioContext({
		sampleRate: 44100,
		latencyHint: "interactive"
	})

	/** @type {number} */
	#clock

	/** @type {Set<HTMLElement>} */
	subs = new Set()

	midi = {
		/** @type {MIDIInput} */
		input: null,
		/** @type {MIDIOutput} */
		output: null
	}

	connectedCallback() {
		this.when("midiinputdevice", device => {
			if (this.midi.input) {
				// todo does this happen automatically because the <midi-device/>
				// closes the port?
				this.removeEventListener(
					this.midi.input,
					this.shareIncomingMIDIMessage
				)
			}
			this.midi.input = device
			this.midi.input.addEventListener(
				"midimessage",
				this.shareIncomingMIDIMessage
			)
		})
		this.when("midioutputdevice", device => {
			this.midi.output = device
		})
		this.when("sub", element => {
			this.subs.add(element)
		})
		this.when("unsub", element => {
			this.subs.delete(element)
		})

		this.when("send-midi", ([data, timestamp]) => {
			this.send(data, timestamp)
		})
		window.addEventListener("click", () => this.audioContext.resume())
		this.#clock = window.setInterval(() => {
			this.announce("tick")
		}, 4)
	}

	disconnectedCallback() {
		clearInterval(this.#clock)
	}

	shareIncomingMIDIMessage = event => {
		let slurry = new MIDIMessageEvent(event.type, event)
		this.subs.forEach(sub => {
			sub.dispatchEvent(slurry)
		})
	}

	/**
	 * @param {number[]} data
	 * @param {number?} timestamp
	 */
	send(data, timestamp) {
		try {
			this.midi.output.send(data, timestamp)
		} catch (error) {
			console.error(data, error)
		}
	}
}

partyElements.define("synth-party", SynthPartyApp)
