import {downloadZip} from "./vendor/client-zip.js"
import {createElement} from "./lib/xml.js"

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

	/** @param {Sound[]} sounds */
	addSounds(sounds = []) {
		let count = this.sounds.length
		for (let [index, sound] of sounds.entries()) {
			sound.index = count + index
			this.sounds.push(sound)
		}
	}

	/** @param {number} index
	@param {Sound} sound */
	setSound(index, sound) {
		this.sounds[index] = sound
		sound.index = index
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

	updateIndexes() {
		for (let [index, sound] of this.sounds.entries()) {
			sound.index = index
		}
	}

	/**
	 * @param {number} currentIndex
	 * @param {"up"|"down"} direction
	 */
	nudgeSound(currentIndex, direction) {
		let nextIndex = 0
		if (direction == "up") {
			nextIndex = currentIndex + 1
			if (nextIndex >= this.sounds.length) return
		} else {
			nextIndex = currentIndex - 1
			if (nextIndex < 0) return
		}
		this.swapSounds(currentIndex, nextIndex)
	}

	/**
	 * @param {number} a
	 * @param {number} b
	 */
	swapSounds(a, b) {
		let sounds = this.sounds
		;[sounds[a], sounds[b]] = [sounds[b], sounds[a]]
		sounds[a].index = a
		sounds[b].index = b
	}

	toXML({sortable = false} = {}) {
		let doc = document.implementation.createDocument(null, "kit")
		doc.documentElement.appendChild(createElement(doc, "defaultParams", {}))
		let sources = createElement(doc, "soundSources")
		doc.documentElement.appendChild(sources)
		for (let sound of this.sounds) {
			sources.appendChild(
				sound.toXML({
					kitName: this.name,
					doc,
					sortable
				})
			)
		}
		let selectedDrum = createElement(doc, "selectedDrumIndex")
		selectedDrum.textContent = "0"
		doc.documentElement.appendChild(selectedDrum)
		return doc
	}

	toString({sortable = false} = {}) {
		// can't use the serializer because the self-closing tags appear to break
		// the deluge's xml parser?
		// let serializer = new XMLSerializer()
		// return serializer.serializeToString(this.toXML())
		let element = document.createElement("element")
		element.appendChild(this.toXML({sortable}).documentElement)
		return element.innerHTML
	}

	blob({sortable = false} = {}) {
		let files = [
			{
				name: `KITS/${this.name}.XML`,
				/** @type {string|Blob} */
				input: this.toString({sortable})
			}
		]

		for (let sound of this.sounds) {
			files.push({
				name: sound.filename(this.name, {sortable}),
				input: sound.blob()
			})
		}

		return downloadZip(files).blob()
	}

	async download({sortable = false} = {}) {
		let link = document.createElement("a")
		link.href = URL.createObjectURL(await this.blob({sortable}))
		link.download = this.name + ".zip"
		link.click()
		link.remove()
	}
}
