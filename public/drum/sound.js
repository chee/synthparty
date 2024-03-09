import {createElement} from "./lib/xml.js"
import wav from "./lib/audiobuffer-to-wav.js"
import showOpenFilePicker from "./lib/open-file-picker.js"
import rand from "./lib/rand.js"
import colours from "./lib/colours.js"
let context = new AudioContext()
let iphoneSilenceElement = document.querySelector("audio")

export default class Sound {
	name = "new sound"
	color = rand(colours)

	static async browse({multiple = false} = {}) {
		let handles = await showOpenFilePicker({multiple})
		let sounds = []
		for (let fh of handles) {
			let file = await fh.getFile()
			let audiobuffer = await context.decodeAudioData(await file.arrayBuffer())
			let sound = new Sound(
				file.name.replace(/(.*)\.[^.]+$/, (_, c) => c),
				audiobuffer
			)
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
		return new Blob([wav(this.audiobuffer)])
	}

	audition() {
		context.resume()
		iphoneSilenceElement.play()
		let buffersource = new AudioBufferSourceNode(context, {
			buffer: this.audiobuffer
		})
		buffersource.connect(context.destination)
		buffersource.start()
		buffersource.onended = () => iphoneSilenceElement.pause()
	}

	/** @param {string} kitName */
	filename(kitName) {
		return `SAMPLES/${kitName}/${this.name}.wav`
	}

	toXML({/**@type {string}*/ kitName, /**@type{XMLDocument}*/ doc}) {
		let sound = createElement(doc, "sound", {
			name: this.name
		})

		sound.append(
			createElement(doc, "osc1", {
				type: "sample",
				fileName: this.filename(kitName)
			})
		)

		sound.append(
			createElement(doc, "defaultParams", {
				oscBVolume: "0x80000000",
				lpfFrequency: "0x7FFFFFFF"
			})
		)

		return sound
	}
}
