import {createElement} from "./lib/xml.js"
import wav from "./lib/audiobuffer-to-wav.js"
import showOpenFilePicker from "./lib/open-file-picker.js"
import rand from "./lib/rand.js"
import colours from "./lib/colours.js"
import decodeAiffToAudioBuffer from "./lib/aif.js"
let context = new AudioContext()
let iphoneSilenceElement = document.querySelector("audio")

/** @param {DataView} view */
function readString(view, offset, length) {
	let chars = []
	for (let i = offset; i <= offset + length - 1; i++) {
		chars.push(view.getUint8(i))
	}
	return String.fromCharCode(...chars)
}

export default class Sound {
	index = -1
	name = "new sound"
	color = rand(colours)
	/** @type AudioBufferSourceNode */
	#buffersource

	/** @param {ArrayBuffer} arraybuffer */
	static fromAIF(arraybuffer) {
		let view = new DataView(arraybuffer)
		let offset = -1
		let sounds = []
		for (let i = 0; i < arraybuffer.byteLength; i += 4) {
			let id = readString(view, i, 4)

			if (id == "APPL") {
				let appl = i
				let len = view.getUint32(appl + 4)
				let op1 = readString(view, appl + 8, 4)
				if (op1 != "op-1") {
					continue
				}
				let json = readString(view, appl + 12, len - 12).trim()
				let config = JSON.parse(json)
				console.log(config)
			}

			if (id == "SSND") {
				let ssnd = i
				let len = view.getUint32(ssnd + 4, true)
			}
		}
	}

	/** @param {Sound} sound */
	replace(sound) {
		this.name = sound.name
		this.audiobuffer = sound.audiobuffer
	}

	static async browse({multiple = false} = {}) {
		let handles = await showOpenFilePicker({multiple})
		let sounds = []
		for (let fh of handles) {
			let file = await fh.getFile()
			let arraybuffer = await file.arrayBuffer()
			let name = file.name.replace(/(.*)\.[^.]+$/, (_, c) => c)
			if (file.type == "audio/x-aiff") {
				// activate scoundrel mode
				try {
					sounds.concat(Sound.fromAIF(arraybuffer))
					continue
				} catch (error) {
					console.error(error)
				}
			}
			let audiobuffer = await context.decodeAudioData(arraybuffer)
			let sound = new Sound(name, audiobuffer)
			sounds.push(sound)
		}
		return sounds
	}

	/**
	 * @param {string} name
	 * @param {AudioBuffer} audiobuffer
	 */
	constructor(name, audiobuffer) {
		this.name = name
		this.audiobuffer = audiobuffer
	}

	blob() {
		return new Blob([wav(this.audiobuffer, this.index)])
	}

	audition() {
		context.resume()
		iphoneSilenceElement.play()
		if (this.#buffersource) {
			this.#buffersource.stop()
		}
		let buffersource = new AudioBufferSourceNode(context, {
			buffer: this.audiobuffer
		})
		buffersource.connect(context.destination)
		buffersource.start()
		buffersource.onended = () => iphoneSilenceElement.pause()
		this.#buffersource = buffersource
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
			sideChainSend: this.index == 0 ? 2147483647 : 0
		})

		sound.append(
			createElement(doc, "osc1", {
				type: "sample",
				fileName: this.filename(kitName, {sortable})
			})
		)

		sound.append(
			createElement(doc, "defaultParams", {
				oscAVolume: "0x7FFFFFFF",
				oscBVolume: "0x80000000",
				lpfFrequency: "0x7FFFFFFF"
			})
		)

		return sound
	}
}
