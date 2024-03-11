import {createElement} from "./lib/xml.js"
import wav from "./lib/audiobuffer-to-wav.js"
import showOpenFilePicker from "./lib/open-file-picker.js"
import rand from "./lib/rand.js"
import colours from "./lib/colours.js"
import {decode16BitPCM} from "./lib/aif.js"
let context = new AudioContext()
let iphoneSilenceElement = document.querySelector("audio")

/** @param {DataView} view */
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

export default class Sound {
	index = -1
	name = "new sound"
	color = rand(colours)
	/** @type AudioBufferSourceNode */
	#buffersource

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
			// anything. not to 65536, not to 44100, not to 2147483646, not to 12 seconds
			// but i've tried all the other numbers and this is the best number,
			// hands down, no question
			// the 1219.2 i got by 2032*12/20
			let divisor = op1Config.stereo == true ? 1219.2 : 2032
			return Math.floor(num / divisor / 2) * 2
		}

		if (op1Config) {
			return op1Config.start
				.map((s, index) => {
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
				})
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
			let arraybuffer = await file.arrayBuffer()
			let name = removeExtension(file.name)
			if (["audio/aiff", "audio/x-aiff"].includes(file.type)) {
				// activate scoundrel mode
				try {
					sounds = sounds.concat(Sound.fromAIF(arraybuffer, name))
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

	/*
	 * @param {AudioBuffer} audiobuffer
	 * @param {string} name
	 */
	constructor(audiobuffer, name) {
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

/** standard layout of an op1 kit*/
let stdLayout = [
	"kick",
	"kick_alt",
	"snare",
	"snare_alt",
	"rimshot",
	"clapsnap",
	"perc",
	"eight",
	"hat",
	"pedal",
	"open_hat",
	"ten",
	"eleven",
	"ride",
	"twelve",
	"crash",
	"noot",
	"thirteen",
	"fourteen",
	"fx_1",
	"fx_2",
	"fx_3",
	"fx_4",
	"fx_5"
]
