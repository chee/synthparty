import {setAttributes, createElement} from "./xml.js"
import {downloadZip} from "./vendor/client-zip.js"

// todo should i include all the other details in here so a kit could also be
// loaded and edited?
export default class Kit {
	name = "new kit"
	/** @type {Array<import("./sound.js").default>} */
	sounds = []
	xml = document.implementation.createDocument(null, "kit")

	toXML() {
		this.xml = document.implementation.createDocument(null, "kit")
		setAttributes(this.xml.documentElement, {
			firmwareVersion: "c1.0.1"
		})
		this.xml.documentElement.appendChild(
			this.xml.createElement("defaultParams")
		)
		let sources = createElement(this.xml, "soundSources")
		this.xml.documentElement.appendChild(sources)
		for (let sound of this.sounds) {
			sources.appendChild(sound.toXML(this))
		}
		let index = createElement(this.xml, "selectedDrumIndex")
		index.textContent = "1"
		this.xml.documentElement.appendChild(index)
		return this.xml
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

		for (let sound of this.sounds) {
			files.push({
				name: sound.filename(this.name),
				input: sound.blob()
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
