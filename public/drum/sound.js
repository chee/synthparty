import {createElement} from "./lib/xml.js"
import wav from "./lib/audiobuffer-to-wav.js"
import showOpenFilePicker from "./lib/open-file-picker.js"
import rand from "./lib/rand.js"
import colours from "./lib/colours.js"
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

/**
 * @param {ArrayBuffer} pcm
 */
function pcmToAudiobuffer(
	pcm,
	/** @type {{numberOfChannels: number, sampleRate: number}} */
	{numberOfChannels, sampleRate}
) {
	let audiobuffer = new AudioBuffer({
		numberOfChannels,
		length: pcm.byteLength / numberOfChannels / 2,
		sampleRate
	})
	for (let channel = 0; channel < numberOfChannels; channel++) {
		let channelData = audiobuffer.getChannelData(channel)
		let view = new DataView(pcm)

		for (
			let i = 0, j = channel * 2;
			i < channelData.length;
			i++, j += numberOfChannels * 2
		) {
			let sample = view.getInt16(j, true)
			channelData[i] = sample / 0x8000
		}
	}
	return audiobuffer
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

		function rounde(num = 0) {
			return 2 * Math.round(num / 2)
		}

		// todo support op-1 field kits
		if (op1Config && numberOfChannels == 1) {
			return op1Config.start
				.map((s, index) => {
					let start = rounde(s / 2048)
					let end = rounde(op1Config.end[index] / 2048)
					console.log(op1Config.end[index], "e")
					if (start < end) {
						let pcm = ssnd.slice(start, end)

						let audiobuffer = pcmToAudiobuffer(pcm, {
							numberOfChannels,
							sampleRate
						})

						return new Sound(stdLayout[index], audiobuffer)
					}
				})
				.filter(Boolean)
		} else {
			let audiobuffer = pcmToAudiobuffer(ssnd, {numberOfChannels, sampleRate})
			return new Sound(name, audiobuffer)
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
			if (["audio/aiff", "audio/x-aiff"].includes(file.type)) {
				// activate scoundrel mode
				try {
					sounds = sounds.concat(
						Sound.fromAIF(arraybuffer, removeExtension(file.name))
					)
					continue
				} catch (error) {
					console.error(error)
				}
			}
			let audiobuffer = await context.decodeAudioData(arraybuffer)
			let sound = new Sound(removeExtension(file.name), audiobuffer)
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
