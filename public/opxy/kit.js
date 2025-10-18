import {downloadZip} from "/vendor/client-zip.js"
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
		if (direction == "down") {
			nextIndex = currentIndex + 1
			if (nextIndex >= this.sounds.length) return
		} else {
			nextIndex = currentIndex - 1
			if (nextIndex < 0) return
		}
		this.swapSounds(currentIndex, nextIndex)
	}

	/**
	 * @param {number} index
	 */
	killSound(index) {
		this.sounds.splice(index, 1)
		this.updateIndexes()
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

	toJSON() {
		return {
			engine: {
				bendrange: 0,
				highpass: 0,
				modulation: {
					aftertouch: {
						amount: 21953,
						target: 18022
					},
					modwheel: {
						amount: 32767,
						target: 0
					},
					pitchbend: {
						amount: 16710,
						target: 0
					},
					velocity: {
						amount: 16383,
						target: 0
					}
				},
				params: [16384, 16384, 16384, 16384, 16384, 16384, 16384, 16384],
				playmode: "poly",
				"portamento.amount": 0,
				"portamento.type": 32767,
				transpose: 12,
				"tuning.root": 0,
				"tuning.scale": 3045,
				"velocity.sensitivity": 6879,
				volume: 22970,
				width: 0
			},
			envelope: {
				amp: {
					attack: 0,
					decay: 0,
					release: 0,
					sustain: 32767
				},
				filter: {
					attack: 3932,
					decay: 13167,
					release: 9502,
					sustain: 18062
				}
			},
			fx: {
				active: false,
				params: [15728, 16711, 10382, 5632, 0, 0, 0, 0],
				type: "z lowpass"
			},
			lfo: {
				active: true,
				params: [9168, 6334, 23210, 29491, 0, 0, 0, 18186],
				type: "random"
			},
			octave: -1,
			platform: "OP-XY",
			regions: this.sounds,
			type: "drum",
			version: 4
		}
	}

	blob({sortable = false, addSmplBlock = false} = {}) {
		const files = [
			{
				name: `${this.name}.preset/patch.json`,
				/** @type {string|Blob} */
				input: JSON.stringify(this)
			}
		]

		for (const sound of this.sounds) {
			files.push({
				name: sound.filename(this.name),
				input: sound.blob({addSmplBlock})
			})
		}

		return downloadZip(files).blob()
	}

	async download({sortable = false, addSmplBlock = false} = {}) {
		let link = document.createElement("a")
		link.href = URL.createObjectURL(await this.blob({sortable, addSmplBlock}))
		link.download = this.name + ".zip"
		link.click()
		link.remove()
	}
}
