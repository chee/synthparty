import {partyElements} from "/elements/party-elements.js"
import CCSlider from "./cc-slider.js"

/**
 * @template {import("/elements/party-elements.js").PartyEventMap} E
 * @extends {CCSlider<E & {value: number}>}
 */
export default class CCTapeSlider extends CCSlider {
	/**
	 * @param {import("./abstract-control-change.js").MouseMessage} message
	 */
	mouse(message) {
		let {mouse, event} = message

		let val = 127 - Math.round((mouse.y / this.canvas.height) * 127)
		this.value = val
		this.announce("send-midi", [[0xb0, 74, (127 - val) * 0.75 + 32]])
		this.announce("send-midi", [[0xb0, 41, val * 0.2]])
		this.announce("send-midi", [[0xb0, 58, (127 - val) * 0.4 + 10]])
		this.announce("send-midi", [[0xb0, 91, val * 0.3]])
		this.draw()
	}

	tick() {}
}

partyElements.define("cc-tape", CCTapeSlider)
