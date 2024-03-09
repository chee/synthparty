import {createElement} from "./xml.js"
import wav from "./vendor/audiobuffer-to-wav.js"

export default class Sound {
	name = "new sound"

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

	/** @param {string} kitName */
	filename(kitName) {
		return `SAMPLES/${kitName}/${this.name}.wav`
	}

	/** @param {import("./kit.js").default} kit */
	toXML(kit) {
		let sound = createElement(kit.xml, "sound", {
			name: this.name
		})

		sound.append(
			createElement(kit.xml, "osc1", {
				type: "sample",
				fileName: this.filename(kit.name)
			})
		)

		sound.append(
			createElement(kit.xml, "defaultParams", {
				oscBVolume: "0x80000000",
				lpfFrequency: "0x7FFFFFFF"
			})
		)

		return sound
	}
}
