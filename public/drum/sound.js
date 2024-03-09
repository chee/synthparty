import {createElement} from "./xml.js"

export default class Sound {
	name = "new sound"

	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.name = name
	}

	/** @param {import("./kit.js").default} kit */
	toXML(kit) {
		let sound = createElement(kit.xml, "sound", {
			name: this.name
		})

		sound.append(
			createElement(kit.xml, "osc1", {
				type: "sample",
				fileName: `SAMPLES/${kit.name}/${this.name}.wav`
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
