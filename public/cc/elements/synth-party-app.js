import createMIDIFollowMap from "../lib/midi-follow-map.js"
import CCSlider from "./cc-slider.js"
import CCXY from "./cc-xy.js"
import {PartyElement, partyElements} from "./party-elements.js"

/**
 * @param {string} label
 * @param {HTMLElement[]} children
 * @returns {HTMLElement}
 */
function group(label, children) {
	let tmpl = /** @type {HTMLTemplateElement}*/ (
		document.getElementById("group")
	)
	let group = /** @type {HTMLElement} */ (tmpl.content.cloneNode(true))
	let figure = group.querySelector("figure")
	let items = document.createElement("div")
	items.className = "cc-group-items"
	let caption = group.querySelector("figcaption")
	if (label) {
		caption.textContent = label
	} else {
		caption.remove()
	}
	figure.prepend(items)
	items.append(...children)
	return group
}

function oscillator(label, {volume, pitch, width, feedback, wavetable}) {
	return group(
		label,
		[
			volume &&
				CCSlider.create({
					label: "volume",
					cc: volume
				}),
			pitch &&
				CCSlider.create({
					label: "trans",
					cc: pitch
				}),
			width &&
				CCSlider.create({
					label: "width",
					cc: width
				}),
			feedback &&
				CCSlider.create({
					label: "feedback",
					cc: feedback
				}),
			wavetable &&
				CCSlider.create({
					label: "wavetable",
					cc: wavetable
				})
		].filter(Boolean)
	)
}

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
			CCSlider.create({
				label: "pitch",
				cc: map.pitch
			})
		)
		grid.append(
			CCSlider.create({
				label: "porta",
				cc: map.portamento
			})
		)
		grid.append(
			CCXY.create({
				label: "sidechain",
				x: map.compressorShape,
				y: map.volumePostReverbSend,
				left: "shape-",
				right: "shape+",
				top: "level+",
				bottom: "level-"
			})
		)
		grid.append(
			group("", [
				CCXY.create({
					label: "low pass",
					x: map.lpfResonance,
					y: map.lpfFrequency,
					left: "res-",
					right: "res+",
					top: "freq+",
					bottom: "freq-"
				}),
				CCSlider.create({
					label: "morph",
					cc: 70
				})
			])
		)
		grid.append(
			group("", [
				CCXY.create({
					label: "high pass",
					x: map.hpfResonance,
					y: map.hpfFrequency,
					left: "res-",
					right: "res+",
					top: "freq+",
					bottom: "freq-"
				}),
				CCSlider.create({
					label: "morph",
					cc: 83
				})
			])
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
		grid.append(
			CCSlider.create({
				label: "lfo1",
				cc: map.lfo1Rate
			})
		)
		grid.append(
			CCSlider.create({
				label: "lfo2",
				cc: map.lfo2Rate
			})
		)
		grid.append(
			group("space", [
				CCXY.create({
					label: "delay",
					x: map.delayFeedback,
					y: map.delayRate,
					left: "fb-",
					right: "fb+",
					top: "fast",
					bottom: "slow"
				}),
				CCSlider.create({
					label: "reverb",
					cc: map.reverbAmount
				})
			])
		)

		grid.append(
			CCSlider.create({
				label: "noise",
				cc: map.noiseVolume
			})
		)

		grid.append(
			group("distort", [
				CCSlider.create({
					label: "wavefold",
					cc: map.waveFold
				}),
				CCSlider.create({
					label: "bitcrush",
					cc: map.bitcrushAmount
				}),
				CCSlider.create({
					label: "decimate",
					cc: map.sampleRateReduction
				})
			])
		)

		grid.append(
			group("modfx", [
				CCXY.create({
					label: "feedback/rate",
					x: map.modFXRate,
					y: map.modFXFeedback,
					left: "fb-",
					right: "fb+",
					top: "fast",
					bottom: "slow"
				}),
				CCXY.create({
					label: "offset/depth",
					x: map.modFXOffset,
					y: map.modFXDepth,
					left: "offset-",
					right: "offset+",
					top: "deep",
					bottom: "shallow"
				})
			])
		)

		grid.append(
			oscillator("oscillator 1", {
				volume: 21,
				pitch: 12,
				width: 23,
				feedback: 24,
				wavetable: 25
			})
		)

		grid.append(
			oscillator("oscillator 2", {
				volume: 26,
				pitch: 13,
				width: 28,
				feedback: 29,
				wavetable: 30
			})
		)

		grid.append(
			oscillator("fm 1", {
				volume: 54,
				pitch: 14,
				feedback: 55
			})
		)

		grid.append(
			oscillator("fm 1", {
				volume: 56,
				pitch: 15,
				feedback: 57
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
