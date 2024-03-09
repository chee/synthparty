import {setAttributes, createElement} from "./xml.js"

// todo should i include all the other details in here so a kit could also be
// loaded and edited?
export default class Kit {
	name = "new kit"
	/** @type {Array<import("./sound.js").default>} */
	sounds = []
	xml = document.implementation.createDocument(null, "kit")

	toXML() {
		setAttributes(this.xml.documentElement, {
			firmwareVersion: "c1.0.1"
		})
		this.xml.appendChild(this.xml.createElement("defaultParams"))
		let sources = createElement(this.xml, "soundSources")
		this.xml.appendChild(sources)
		for (let sound of this.sounds) {
			sources.appendChild(sound.toXML(this))
		}
		let index = createElement(this.xml, "selectedDrumIndex")
		index.textContent = "1"
		this.xml.appendChild(index)
		return this.xml
	}

	toString() {
		let serializer = new XMLSerializer()
		return serializer.serializeToString(this.toXML())
	}
}
