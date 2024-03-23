import {createElement} from "../lib/html.js"
import createMIDIFollowMap from "../lib/midi-follow-map.js"
import CCADSR from "./cc-adsr.js"
import CCLFO from "./cc-lfo.js"
import CCSlider from "./cc-slider.js"
import CCXY from "./cc-xy.js"
import {PartyElement, partyElements} from "/elements/party-elements.js"

let featureFlags = location.search.slice(1).split("&")

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
				createElement("cc-slider", {
					label: "volume",
					cc: volume
				}),
			pitch &&
				createElement("cc-slider", {
					label: "trans",
					cc: pitch
				}),
			width &&
				createElement("cc-slider", {
					label: "width",
					cc: width
				}),
			feedback &&
				createElement("cc-slider", {
					label: "feedback",
					cc: feedback
				}),
			wavetable &&
				createElement("cc-slider", {
					label: "wavetable",
					cc: wavetable
				})
		].filter(Boolean)
	)
}

/**
 * @extends {PartyElement<{
	"midiinputdevice": MIDIInput
	"midioutputdevice": MIDIOutput
	"tick": void
 } & import("./abstract-control-change.js").AbstractControlChangeEventMap>}
 */
export default class SynthPartyApp extends PartyElement {
	/** @type {number} */
	#clock = 0

	/** @type {Set<HTMLElement>} */
	subs = new Set()

	midi = {
		/** @type {MIDIInput?} */
		input: null,
		/** @type {MIDIOutput?} */
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

		this.$("#add-xy").addEventListener("click", () => {
			// todo this should be a static prop on PartyElements
			this.dialogFor(CCXY, "cc-xy")
		})

		this.$("#add-slider").addEventListener("click", () => {
			// todo the default htmlname should be a static prop on PartyElements
			this.dialogFor(CCSlider, "cc-slider")
		})

		this.$("#add-lfo").addEventListener("click", () => {
			// todo the default htmlname should be a static prop on PartyElements
			this.dialogFor(CCLFO, "cc-lfo")
		})

		this.$("#add-adsr").addEventListener("click", () => {
			// todo the default htmlname should be a static prop on PartyElements
			this.dialogFor(CCADSR, "cc-adsr")
		})
	}

	dialogFor(ElType, elName) {
		let dialog = /** @type {HTMLDialogElement} */ (this.$("#dialog"))
		dialog.textContent = ""
		let formElement = this.createForm(ElType.form)
		dialog.append(formElement)
		dialog.showModal()
		dialog.addEventListener("ok", () => dialog.close())
		dialog.addEventListener("cancel", () => dialog.close())
		dialog.addEventListener(
			"close",
			() => {
				if (dialog.returnValue == "ok") {
					this.$("#grid").append(
						createElement(elName, this.readForm(ElType.form, formElement))
					)
				} else {
					console.info("cancel")
				}
				dialog.returnValue = ""
			},
			{once: true}
		)
	}

	createForm(form) {
		let formElement = document.createElement("form")
		formElement.method = "dialog"
		for (let [property, descriptor] of Object.entries(form)) {
			let label = document.createElement("label")
			label.textContent = descriptor.label
			let input = document.createElement("input")
			for (let [prop, value] of Object.entries(descriptor.props)) {
				input[prop] = value
			}
			input.id = property
			label.append(input)
			formElement.append(label)
		}

		let cancel = document.createElement("input")
		cancel.value = "cancel"
		cancel.type = "reset"
		cancel.onclick = () => this.announce("cancel")

		let ok = document.createElement("input")
		ok.value = "ok"
		ok.type = "submit"
		ok.onclick = () => this.announce("ok")

		let menu = document.createElement("menu")

		menu.append(cancel, ok)
		formElement.append(menu)
		return formElement
	}

	readForm(form, formElement) {
		let result = {}
		for (let [property, descriptor] of Object.entries(form)) {
			let el = /** @type {HTMLInputElement}*/ (
				formElement.querySelector("#" + property)
			)
			let value =
				descriptor.props.type == "number" ? Number(el.value) : el.value
			result[property] = value
		}
		return result
	}

	/** @param {import("../lib/midi-follow-map.js").MIDIFollowMap} map*/
	useMIDIFollow(map) {
		let grid = this.$("#grid")
		this.$("#grid").textContent = ""
		if (featureFlags.includes("tape")) {
			grid.append(createElement("cc-tape", {label: "tape"}))
		}

		grid.append(
			createElement("cc-xy", {
				label: "mix",
				ccX: map.pan,
				ccY: map.volumePostFX,
				top: "loud",
				bottom: "quiet"
			})
		)
		grid.append(
			createElement("cc-slider", {
				label: "pitch",
				cc: map.pitch
			})
		)
		grid.append(
			createElement("cc-slider", {
				label: "porta",
				cc: map.portamento
			})
		)
		grid.append(
			createElement("cc-xy", {
				label: "sidechain",
				ccX: map.compressorShape,
				ccY: map.volumePostReverbSend,
				left: "shape-",
				right: "shape+",
				top: "level+",
				bottom: "level-"
			})
		)
		grid.append(
			group("", [
				createElement("cc-xy", {
					label: "low pass",
					ccX: map.lpfResonance,
					ccY: map.lpfFrequency,
					left: "res-",
					right: "res+",
					top: "freq+",
					bottom: "freq-"
				}),
				createElement("cc-slider", {
					label: "morph",
					cc: 70
				})
			])
		)
		grid.append(
			group("", [
				createElement("cc-xy", {
					label: "high pass",
					ccX: map.hpfResonance,
					ccY: map.hpfFrequency,
					left: "res-",
					right: "res+",
					top: "freq+",
					bottom: "freq-"
				}),
				createElement("cc-slider", {
					label: "morph",
					cc: 83
				})
			])
		)
		grid.append(
			createElement("cc-xy", {
				label: "bass",
				ccX: map.bass,
				ccY: map.bassFreq,
				left: "gain-",
				right: "gain+",
				top: "freq+",
				bottom: "freq-"
			})
		)
		grid.append(
			createElement("cc-xy", {
				label: "treble",
				ccX: map.treble,
				ccY: map.trebleFreq,
				left: "gain-",
				right: "gain+",
				top: "freq",
				bottom: "freq"
			})
		)
		grid.append(
			createElement("cc-slider", {
				label: "lfo1",
				cc: map.lfo1Rate
			})
		)
		grid.append(
			createElement("cc-slider", {
				label: "lfo2",
				cc: map.lfo2Rate
			})
		)
		grid.append(
			group("space", [
				createElement("cc-xy", {
					label: "delay",
					ccX: map.delayFeedback,
					ccY: map.delayRate,
					left: "fb-",
					right: "fb+",
					top: "fast",
					bottom: "slow"
				}),
				createElement("cc-slider", {
					label: "reverb",
					cc: map.reverbAmount
				})
			])
		)

		grid.append(
			createElement("cc-slider", {
				label: "noise",
				cc: map.noiseVolume
			})
		)

		grid.append(
			group("distort", [
				createElement("cc-slider", {
					label: "wavefold",
					cc: map.waveFold
				}),
				createElement("cc-slider", {
					label: "bitcrush",
					cc: map.bitcrushAmount
				}),
				createElement("cc-slider", {
					label: "decimate",
					cc: map.sampleRateReduction
				})
			])
		)

		grid.append(
			group("modfx", [
				createElement("cc-xy", {
					label: "feedback/rate",
					ccX: map.modFXRate,
					ccY: map.modFXFeedback,
					left: "fb-",
					right: "fb+",
					top: "fast",
					bottom: "slow"
				}),
				createElement("cc-xy", {
					label: "offset/depth",
					ccX: map.modFXOffset,
					ccY: map.modFXDepth,
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
			createElement("cc-xy", {
				label: "arp",
				ccX: map.arpGate,
				ccY: map.arpRate,
				left: "short",
				right: "long",
				top: "fast",
				bottom: "slow"
			})
		)

		grid.append(
			createElement("cc-adsr", {
				label: "envelope 1",
				ccAttack: map.env1Attack,
				ccDecay: map.env1Decay,
				ccSustain: map.env1Sustain,
				ccRelease: map.env1Release
			})
		)

		grid.append(
			createElement("cc-adsr", {
				label: "envelope 2",
				ccAttack: map.env2Attack,
				ccDecay: map.env2Decay,
				ccSustain: map.env2Sustain,
				ccRelease: map.env2Release
			})
		)
	}

	disconnectedCallback() {
		clearInterval(this.#clock)
	}

	shareIncomingMIDIMessage = event => {
		let slurry = new MIDIMessageEvent(event.type, event)
		// todo send specific clock events
		this.subs.forEach(sub => {
			sub.announce(event.type, event.data)
		})
	}

	/**
	 * @param {number[]} data
	 * @param {number} [timestamp]
	 */
	send(data, timestamp) {
		try {
			this.midi.output?.send(data, timestamp)
		} catch (error) {
			console.error(data, error)
		}
		this.subs.forEach(sub => {
			sub.announce("midimessage", data)
		})
	}
}

partyElements.define("synth-party", SynthPartyApp)
