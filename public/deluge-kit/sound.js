import {createElement, renderNumber as int32} from "./lib/xml.js"
import wav from "./lib/audiobuffer-to-wav.js"
import showOpenFilePicker from "./lib/open-file-picker.js"
import rand from "./lib/rand.js"
import colours from "./lib/colours.js"
import {decode16BitPCM, isAIF} from "./lib/aif.js"
let context = new AudioContext()
let iphoneSilenceElement = document.querySelector("audio")

/**
 * @param {DataView} view
 * @param {number} offset
 * @param {number} length
 */
function readString(view, offset, length) {
	let chars = []
	for (let i = offset; i <= offset + length - 1; i++) {
		chars.push(view.getUint8(i))
	}

	return String.fromCharCode(...chars.filter(n => n))
}

function removeExtension(filename = "") {
	return filename.replace(/(.*)\.[^.]+$/, (_, c) => c)
}

function removeNumericPrefix(filename = "") {
	return filename.replace(/^\d\d\d (.*)/, (_, c) => c)
}

export default class Sound {
	index = -1
	name = "new sound"
	color = rand(colours)
	editorMode = "waveform"
	/** @type {"cut"|"once"|"loop"} */
	loopMode = "once"
	polyphonic = "auto"
	reversed = false
	timeStretch = false
	linearInterpolation = false
	sidechainSend = false
	custom1 = "pitch"
	custom2 = "decimation"
	custom3 = "bitcrush"
	/** @type number? */
	start
	/** @type number? */
	end
	#volume = 50
	#pan = 25

	get volume() {
		return this.#volume
	}

	set volume(volume) {
		this.gainNode.gain.value = volume / 50
		this.#volume = volume
	}

	get pan() {
		return this.#pan
	}

	set pan(pan) {
		this.panNode.pan.value = (pan / 50) * 2 - 1
		this.#pan = pan
	}

	/** @type AudioBufferSourceNode[] */
	#buffersources = []

	static DynamicRange = 50

	static CustomOption = {
		pitch: "pitch",
		bitcrush: "bitcrushAmount",
		decimation: "sampleRateReduction"
	}

	static SampleMode = {
		cut: "0",
		once: "1",
		loop: "2"
	}

	static PatchSource = {
		lfo1: "lfo1",
		lfo2: "lfo2",
		env1: "env1",
		env2: "env2",
		velo: "velo",
		note: "note",
		comp: "comp",
		rand: "rand",
		pres: "pres",
		mpeX: "mpeX",
		mpeY: "mpeY"
	}

	/** @param {ArrayBuffer} arraybuffer */
	static fromAIF(arraybuffer, name = "") {
		let view = new DataView(arraybuffer)
		let sampleRate = -1
		let numberOfChannels = -1
		/** @type {ArrayBuffer} */
		let ssnd
		let op1Config

		for (let offset = 0; offset + 4 < arraybuffer.byteLength; offset += 1) {
			let id = readString(view, offset, 4)

			// todo write a chunk lib
			if (id == "COMM") {
				let _len = view.getUint32(offset + 4)
				numberOfChannels = view.getInt16(offset + 8)
				let _numSampleFrames = view.getUint32(offset + 10)
				// `10` tells us this 16-bit audio
				let _sampleSize = view.getInt16(offset + 14)
				/* lmao i have no idea how to read a long	double */
				// https://wiki.multimedia.cx/index.php/Audio_Interchange_File_Format
				/*
				 * SignBit  	1 bit
				 * Exponent 	15 bits
				 * Mantissa 	64 bits
				 */
				// i think on the op-1 and field it's always
				// `0x400EAC44000000000000`, i.e. 44.1k
				sampleRate = 44100
			}

			if (id == "APPL") {
				let len = view.getInt32(offset + 4)
				let op1 = readString(view, offset + 8, 4)
				if (op1 != "op-1") {
					continue
				}
				let json = readString(view, offset + 12, len - 4)
				try {
					op1Config = JSON.parse(json)
				} catch (error) {
					console.error(error)
					console.info(json)
				}
			}

			if (id == "SSND") {
				let len = view.getUint32(offset + 4)
				ssnd = arraybuffer.slice(offset + 8, offset + 8 + len)
			}
		}

		function op1tosample(num = 0) {
			// i have NO IDEA why it's 2032, i don't understand how that relates to
			// anything. not to 65536, not to 44100, not to 2147483646, not to 12
			// seconds, not to 16 bits. kara points out that it is 127*16, which
			// _are_ both computer numbers. but why?
			// but i've tried all the other numbers and this is the best number,
			// hands down, no question
			// the 1219.2 i got by 2032*12/20
			let divisor = op1Config.stereo == true ? 1219.2 : 2032
			return Math.floor(num / divisor / 2) * 2
		}

		if (op1Config && op1Config.drum_version) {
			return op1Config.start
				.map(
					/**
					 * @param {number} s
					 * @param {number} index
					 */
					(s, index) => {
						let e = op1Config.end[index]
						let start = op1tosample(s)
						let end = op1tosample(e)

						if (start < end) {
							let pcm = ssnd.slice(
								start * numberOfChannels,
								end * numberOfChannels
							)

							let audiobuffer = decode16BitPCM(pcm, {
								numberOfChannels,
								sampleRate,
								littleEndian: op1Config.drum_version == 2
							})
							return new Sound(audiobuffer, stdLayout[index])
						}
					}
				)
				.filter(Boolean)
		} else {
			let audiobuffer = decode16BitPCM(ssnd, {
				numberOfChannels,
				sampleRate,
				littleEndian: true
			})
			return new Sound(audiobuffer, name)
		}
	}

	/** @param {Sound} sound */
	replace(sound) {
		this.name = sound.name
		this.audiobuffer = sound.audiobuffer
	}

	static async browse({multiple = false} = {}) {
		/** @type {FileSystemFileHandle[]} */
		let handles = await showOpenFilePicker({multiple})
		/** @type {Sound[]} */
		let sounds = []
		for (let fh of handles) {
			let file = await fh.getFile()
			try {
				sounds = sounds.concat(await Sound.fromFile(file))
			} catch (error) {
				console.error(error)
			}
		}
		return sounds
	}

	/** @param {File} file */
	static async fromFile(file) {
		let arraybuffer = await file.arrayBuffer()
		let name = removeNumericPrefix(removeExtension(file.name))

		if (isAIF(file)) {
			// activate scoundrel mode
			return Sound.fromAIF(arraybuffer, name)
		}
		let audiobuffer = await context.decodeAudioData(arraybuffer)
		return new Sound(audiobuffer, name)
	}

	/**
	 * @param {AudioBuffer} audiobuffer
	 * @param {string} name
	 */
	constructor(audiobuffer, name) {
		this.name = name
		this.audiobuffer = audiobuffer
		this.start = 0
		this.end = audiobuffer.length
		let chowmein = this.name.toLowerCase()

		if (chowmein.includes("kick")) {
			this.sidechainSend = true
		} else if (chowmein.match(/\b(hat|pedal)\b/)) {
			// hats choke each other
			// owo
			this.polyphonic = "choke"
		}

		this.gainNode = new GainNode(context)
		this.panNode = new StereoPannerNode(context)
		this.gainNode.connect(this.panNode)
		this.panNode.connect(context.destination)
		this.normalize()
	}

	normalize() {
		for (
			let channelIdx = 0;
			channelIdx < this.audiobuffer.numberOfChannels;
			channelIdx++
		) {
			let channel = this.audiobuffer.getChannelData(channelIdx)
			let maxSampleVolume = 0
			for (let f32 of channel) {
				maxSampleVolume = Math.max(Math.abs(f32), maxSampleVolume)
			}

			if (maxSampleVolume != 0) {
				this.volume = 50 * maxSampleVolume
				let mult = (1 / maxSampleVolume) * 0.99
				for (
					let sampleIndex = 0;
					sampleIndex < channel.byteLength;
					sampleIndex++
				) {
					channel[sampleIndex] *= mult
				}
			}
		}
	}

	blob({addSmplBlock = false}) {
		return new Blob([wav(this.audiobuffer, addSmplBlock ? this.index : null)])
	}

	noteOn() {
		context.resume()
		iphoneSilenceElement.play()
		if (this.polyphonic != "poly") {
			this.stop()
		}

		let buffersource = new AudioBufferSourceNode(context, {
			buffer: this.getPlaybuffer()
		})

		if (this.loopMode == "loop") {
			buffersource.loop = true
		}

		this.#buffersources.push(buffersource)
		buffersource.connect(this.gainNode)
		buffersource.start()
	}

	noteOff() {
		if (this.loopMode != "once") {
			this.#buffersources.pop()?.stop()
		}
	}

	getPlaybuffer() {
		let playbuffer = new AudioBuffer({
			length: this.end - this.start,
			sampleRate: this.audiobuffer.sampleRate,
			numberOfChannels: this.audiobuffer.numberOfChannels
		})
		for (
			let channel = 0;
			channel < this.audiobuffer.numberOfChannels;
			channel++
		) {
			playbuffer.copyToChannel(
				this.audiobuffer
					.getChannelData(channel)
					.subarray(this.start, this.end),
				channel
			)

			if (this.reversed) {
				playbuffer.getChannelData(channel).reverse()
			}
		}
		return playbuffer
	}

	stop() {
		let source
		while ((source = this.#buffersources.pop())) {
			source.stop()
		}
	}

	mono() {
		let aub = this.audiobuffer
		let mono = new Float32Array(aub.length)
		for (let channel = 0; channel < aub.numberOfChannels; channel++) {
			let data = aub.getChannelData(channel)
			for (let i = 0; i < data.length; i++) {
				mono[i] += data[i] / aub.numberOfChannels
			}
		}
		return mono
	}

	/** @param {string} kitName */
	filename(kitName, {sortable = false}) {
		let index = this.index.toString().padStart(3, "0") + " "
		return `SAMPLES/${kitName}/${sortable ? index : ""}${this.name}.wav`
	}

	toXML({
		/** @type {string} */ kitName,
		/** @type {XMLDocument} */ doc,
		sortable = false
	}) {
		let sound = createElement(doc, "sound", {
			name: this.name,
			sideChainSend: this.sidechainSend ? 2147483647 : 0,
			polyphonic: this.polyphonic
		})

		let osc = createElement(doc, "osc1", {
			type: "sample",
			fileName: this.filename(kitName, {sortable}),
			loopMode: Sound.SampleMode[this.loopMode],
			reversed: +this.reversed + "",
			linearInterpolation: +this.linearInterpolation + "",
			timeStretchEnable: +this.timeStretch + ""
		})

		sound.append(osc)

		if (this.start || this.end) {
			osc.append(
				createElement(doc, "zone", {
					startSamplePos: this.start || 0,
					endSamplePos: this.end || this.audiobuffer.length
				})
			)
		}

		sound.append(
			createElement(doc, "defaultParams", {
				oscAVolume: int32(50),
				oscBVolume: int32(0),
				lpfFrequency: int32(50),
				volume: int32(this.volume),
				pan: int32(this.pan)
			})
		)

		sound.append(
			createElement(doc, "envelope1", {
				attack: "0x80000000",
				decay: "0xE6666654",
				sustain: "0x7FFFFFD2",
				release: "0x80000000"
			})
		)

		let modKnobs = createElement(doc, "modKnobs")
		sound.append(modKnobs)
		function knob(controlsParam = "", patchAmountFromSource = "") {
			let opts = patchAmountFromSource
				? {controlsParam, patchAmountFromSource}
				: {controlsParam}
			return createElement(doc, "modKnob", opts)
		}
		modKnobs.append(knob("pan"))
		modKnobs.append(knob("volumePostFX"))
		modKnobs.append(knob("lpfResonance"))
		modKnobs.append(knob("lpfFrequency"))
		modKnobs.append(knob("env1Release"))
		modKnobs.append(knob("env1Attack"))
		modKnobs.append(knob("delayFeedback"))
		modKnobs.append(knob("delayRate"))
		modKnobs.append(knob("reverbAmount"))
		modKnobs.append(knob("volumePostReverbSend", "compressor"))
		modKnobs.append(knob("pitch", "lfo1"))
		modKnobs.append(knob("lfo1Rate"))
		modKnobs.append(knob(Sound.CustomOption[this.custom1]))
		modKnobs.append(knob("stutterRate"))
		modKnobs.append(knob(Sound.CustomOption[this.custom3]))
		modKnobs.append(knob(Sound.CustomOption[this.custom2]))

		return sound
	}
}

/** standard layout of an op1 kit*/
let stdLayout = [
	"kick",
	"kick (alt)",
	"snare",
	"snare (alt)",
	"rimshot",
	"clap-snap",
	"perc",
	"eight",
	"closed hat",
	"pedal",
	"open hat",
	"ten",
	"eleven",
	"ride",
	"twelve",
	"crash",
	"noot",
	"thirteen",
	"fourteen",
	"fx 1",
	"fx 2",
	"fx 3",
	"fx 4",
	"fx 5"
]
