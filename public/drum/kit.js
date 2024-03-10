import {downloadZip} from "./vendor/client-zip.js"
import {setAttributes, createElement} from "./lib/xml.js"

/**
 * @typedef {import("./sound.js").default} Sound
 */

// todo should i include all the other details in here so a kit could also be
// loaded and edited?
export default class Kit {
	name = "new kit"
	/** @type {Array<import("./sound.js").default>} */
	sounds = []

	/** @param {string} name */
	constructor(name, sounds = []) {
		this.name = name
		this.sounds = sounds
	}

	clone() {
		return new Kit(this.name, this.sounds)
	}

	/**
	 * @param {number} index
	 */
	getSoundFromUiIndex(index) {
		return this.sounds[this.getSoundIndexFromUiIndex(index)]
	}

	/**
	 * @param {number} index
	 */
	getSoundIndexFromUiIndex(index) {
		return this.sounds.length - 1 - index
	}

	/**
	 * @param {number} currentIndex
	 * @param {"up"|"down"} direction
	 */
	moveSound(currentIndex, direction) {
		let nextIndex = 0
		if (direction == "up") {
			nextIndex = currentIndex + 1
			if (nextIndex >= this.sounds.length) return
		} else {
			nextIndex = currentIndex - 1
			if (nextIndex < 0) return
		}
		let sounds = this.sounds
		let [i, next] = [currentIndex, nextIndex]
		;[sounds[i], sounds[next]] = [sounds[next], sounds[i]]
	}

	toXML() {
		let doc = document.implementation.createDocument(null, "kit")
		setAttributes(doc.documentElement, {
			firmwareVersion: "c1.0.1"
		})
		doc.documentElement.appendChild(doc.createElement("defaultParams"))
		let sources = createElement(doc, "soundSources")
		doc.documentElement.appendChild(sources)
		for (let sound of this.sounds) {
			sources.appendChild(
				sound.toXML({
					kitName: this.name,
					doc
				})
			)
		}
		let index = createElement(doc, "selectedDrumIndex")
		index.textContent = "1"
		doc.documentElement.appendChild(index)
		return doc
	}

	toString() {
		// can't use the serializer because the self-closing tags appear to break
		// the deluge's xml parser?
		// let serializer = new XMLSerializer()
		// return serializer.serializeToString(this.toXML())
		let element = document.createElement("element")
		element.appendChild(this.toXML().documentElement)
		return element.innerHTML
	}

	blob() {
		let files = [
			{
				name: `KITS/${this.name}.XML`,
				/** @type {string|Blob} */
				input: this.toString()
			}
		]

		for (let [index, sound] of this.sounds.entries()) {
			files.push({
				name: sound.filename(this.name),
				input: sound.blob(index)
			})
		}

		return downloadZip(files).blob()
	}

	async download() {
		let link = document.createElement("a")
		link.href = URL.createObjectURL(await this.blob())
		link.download = this.name + ".zip"
		link.click()
		link.remove()
	}
}
