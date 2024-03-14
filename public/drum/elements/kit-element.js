import Kit from "../kit.js"
import adjectives from "../lib/adjectives.js"
import nouns from "../lib/nouns.js"
import rand from "../lib/rand.js"
import Sound from "../sound.js"
import globalStyles from "./global-styles.js"
import {PartyElement, partyElements} from "./party-elements.js"

export default class DelugeKit extends PartyElement {
	nameElement = /** @type {HTMLInputElement} */ (this.$("#name"))
	kit = new Kit(rand(adjectives) + " " + rand(nouns))

	constructor() {
		super()
		this.shadowRoot.adoptedStyleSheets = [globalStyles]
		this.nameElement.value = this.kit.name
		this.addEventListener("dragenter", this.#dragenter)
		this.addEventListener("dragover", this.#dragover)
		this.addEventListener("dragleave", this.#dragleave)
		this.addEventListener("drop", this.#drop)
	}

	/* this runs once when drag enters the target's zone */
	/** @param {DragEvent} event */
	async #dragenter(event) {
		event.preventDefault()
		let {items} = event.dataTransfer
		for (let item of Array.from(items)) {
			// TODO restrict to supported formats by trying to decode a silent
			// audio item of all the formats anyone supports?
			if (item.kind == "file") {
				if (item.type.startsWith("audio/")) {
					this.setAttribute("drop-target", "drop-target")
				} else {
					console.debug(`unsupported type: ${item.kind}, ${event.type}`)
				}
			}
		}
		event.preventDefault()
	}

	/* runs a billion times per sec while you're holding an item over screen*/
	/** @param {DragEvent} event */
	async #dragover(event) {
		event.preventDefault()

		let {items} = event.dataTransfer
		for (let item of Array.from(items)) {
			// TODO restrict to supported formats by trying to decode a silent audio
			// item of all the formats anyone supports?
			if (item.kind == "file") {
				if (item.type.startsWith("audio/")) {
					this.setAttribute("drop-target", "")
				} else {
					console.error(`unsupported type: ${item.kind}, ${event.type}`)
				}
			}
		}
	}

	/** @param {DragEvent} event */
	async #dragleave(event) {
		event.preventDefault()
		this.removeAttribute("drop-target")
	}

	/** @param {DragEvent} event */
	async #drop(event) {
		this.removeAttribute("drop-target")
		if (event.dataTransfer.items) {
			let sounds = []
			event.preventDefault()
			for (let item of Array.from(event.dataTransfer.items)) {
				if (item.kind == "file") {
					let file = item.getAsFile()
					try {
						sounds = sounds.concat(await Sound.fromFile(file))
					} catch (error) {
						console.error(error)
					}
				}
			}
			this.kit.addSounds(sounds)
			this.update()
		}
	}

	connectedCallback() {
		let kit = this.kit
		customElements.whenDefined("deluge-button").then(() => {
			this.$("#download").when("click", (_, event) => {
				kit.download({
					sortable: !event.shiftKey
				})
			})

			this.$("#add").addEventListener("click", async () => {
				let sounds = await Sound.browse({multiple: true})
				kit.addSounds(sounds)
				this.update()
			})
		})
		this.sourcesElement = this.shadowRoot.querySelector("deluge-sources")
		this.nameElement.addEventListener(
			"input",
			() => (kit.name = this.nameElement.value)
		)

		this.sourcesElement.addEventListener("set-name", event => {
			event.target.sound.name = event.detail
		})

		this.sourcesElement.addEventListener("audition", event => {
			if (event.target.sound.polyphonic == "choke") {
				for (let sound of this.kit.sounds) {
					if (sound.polyphonic == "choke" && sound != event.target.sound) {
						sound.stop()
					}
				}
			}
		})

		this.sourcesElement.addEventListener("move-down", event => {
			kit.nudgeSound(event.target.sound.index, "down")
			this.update()
		})

		this.sourcesElement.addEventListener("move-up", event => {
			kit.nudgeSound(event.target.sound.index, "up")
			this.update()
		})

		this.sourcesElement.addEventListener("kill", event => {
			kit.killSound(event.target.sound.index)
			this.update()
		})
	}

	update() {
		let kit = this.kit
		this.nameElement.value = kit.name
		while (kit.sounds.length < this.sourcesElement.children.length) {
			this.sourcesElement.lastElementChild.remove()
		}
		while (kit.sounds.length > this.sourcesElement.children.length) {
			/** @type {HTMLTemplateElement} */
			let soundTemplate = document.querySelector("template#sound")
			let soundElement = soundTemplate.content.cloneNode(true)
			this.sourcesElement.append(soundElement)
		}

		for (let [index, sound] of kit.sounds.entries()) {
			let el = /** @type {import("./sound-element.js").default} */ (
				this.sourcesElement.children[
					this.sourcesElement.children.length - 1 - index
				]
			)

			el.sound = sound
		}
	}
}

partyElements.define("deluge-kit", DelugeKit)
