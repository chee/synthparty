import createMIDIFollowMap from "../lib/midi-follow-map.js"
import CCXY from "./cc-xy.js"
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

	constructor() {
		super()
	}

	connectedCallback() {
		this.when("midiinputdevice", device => {
			if (this.midi.input) {
				// todo does this happen automatically because the <midi-device/>
				// closes the port?
				this.midi.input.removeEventListener(
					"midimessage",
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
		this.$("#default-midi-follow").addEventListener("click", () => {
			this.useMIDIFollow(createMIDIFollowMap())
		})
		let cmf = /** @type {HTMLInputElement} */ (this.$("#custom-midi-follow"))
		cmf.addEventListener("change", async event => {
			let [file] = cmf.files
			this.useMIDIFollow(createMIDIFollowMap(await file.text()))
		})
	}

	/** @param {import("../lib/midi-follow-map.js").MIDIFollowMap} map*/
	useMIDIFollow(map) {
		let grid = this.$("#grid")
		this.$("#grid").textContent = ""
		grid.append(
			CCXY.create({
				label: "mix",
				x: map.pan,
				y: map.volumePostFX,
				top: "loud",
				bottom: "quiet"
			})
		)
		grid.append(
			CCXY.create({
				label: "arp",
				x: map.arpGate,
				y: map.arpRate,
				left: "short",
				right: "long",
				top: "fast",
				bottom: "slow"
			})
		)
		grid.append(
			CCXY.create({
				label: "delay",
				x: map.delayFeedback,
				y: map.delayRate,
				left: "fb-",
				right: "fb+",
				top: "fast",
				bottom: "slow"
			})
		)
		// 		grid.append(
		// 	CCSlider.create({
		// 		label: "reverb",
		// 		x: map.reverbAmount,
		// 		y: map.volumePostReverbSend,
		// 		left: "fb-",
		// 		right: "fb+",
		// 		top: "fast",
		// 		bottom: "slow"
		// 	})
		// )
		grid.append(
			CCXY.create({
				label: "low pass",
				x: map.lpfResonance,
				y: map.lpfFrequency,
				left: "res-",
				right: "res+",
				top: "freq+",
				bottom: "freq-"
			})
		)
		grid.append(
			CCXY.create({
				label: "high pass",
				x: map.hpfResonance,
				y: map.hpfFrequency,
				left: "res-",
				right: "res+",
				top: "freq+",
				bottom: "freq-"
			})
		)
		grid.append(
			CCXY.create({
				label: "bass",
				x: map.bass,
				y: map.bassFreq,
				left: "gain-",
				right: "gain+",
				top: "freq+",
				bottom: "freq-"
			})
		)
		grid.append(
			CCXY.create({
				label: "treble",
				x: map.treble,
				y: map.trebleFreq,
				left: "gain-",
				right: "gain+",
				top: "freq",
				bottom: "freq"
			})
		)
	}

	disconnectedCallback() {
		clearInterval(this.#clock)
	}

	shareIncomingMIDIMessage = event => {
		let slurry = new MIDIMessageEvent(event.type, event)
		this.subs.forEach(sub => {
			sub.announce(event.type, event.data)
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
