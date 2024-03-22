import {partyElements, PartyElement} from "/elements/party-elements.js"

/**
 * @template {import("/elements/party-elements.js").PartyEventMap} E
 * @extends {PartyElement<E>}
 */
export default class CCEditor extends PartyElement {
	#formElement = document.createElement("form")
	constructor() {
		super()
		this.append(this.#formElement)
		this.#formElement.method = "dialog"
	}
}
partyElements.define("cc-editor", CCEditor)
