import {partyElements, PartyElement} from "./party-elements.js"

export default class CCEditor extends PartyElement {
	#formElement = document.createElement("form")
	#form
	constructor() {
		super()
		// this.attachShadow({mode: "open"})
		this.append(this.#formElement)
		this.#formElement.method = "dialog"
	}
}
partyElements.define("cc-editor", CCEditor)
