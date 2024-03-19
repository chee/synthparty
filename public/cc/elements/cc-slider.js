import {partyElements} from "./party-elements.js"
import ControlChange from "./abstract-control-change.js"

/** @type {AudioParam} */
export default class CCSlider extends ControlChange {
	min = 0
	max = 127
	value = 0

	static form = {
		label: {
			label: "name",
			props: {
				type: "text",
				required: true
			}
		},
		cc: {
			label: "cc number",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		},
		min: {
			label: "cc value at base",
			props: {
				min: 0,
				max: 127,
				type: "number"
			}
		},
		max: {
			label: "cc value at tip",
			props: {
				min: 0,
				max: 127,
				type: "number"
			}
		}
	}

	setPropsFromAttributes() {
		if (this.hasAttribute("cc")) {
			this.cc = +this.getAttribute("cc")
		}
		if (this.hasAttribute("min")) {
			this.min = +this.getAttribute("min")
		}
		if (this.hasAttribute("max")) {
			this.max = +this.getAttribute("max")
		}
	}

	connectedCallback() {
		super.connectedCallback()
		this.setPropsFromAttributes()
		this.value = (this.max - this.min) / 2 + this.min
		this.draw()
		this.announce("sub", this)
		this.when("midimessage", this.parseIncomingMIDI)
	}

	parseIncomingMIDI = data => {
		let [msg, cc, value] = data
		let byte = msg.toString(16)
		let [type, channel] = byte
		if (type != "b") {
			//console.debug("ignoring non-cc message")
		}
		if (type == "b") {
			if (cc == this.cc) {
				this.value = value
				this.draw()
			}
		}
	}

	/**
	 * @param {import("./abstract-control-change.js").MouseMessage} message
	 */
	mouse(message) {
		let {mouse, event} = message

		let val =
			this.max -
			Math.round((mouse.y / this.canvas.height) * (this.max - this.min))
		this.value = val
		this.announce("value", val)
		this.announce("send-midi", [[0xb0, this.cc, this.value]])

		this.draw()
	}

	tick() {}

	get styles() {
		let fill =
			this.getStyle("cc-slider-fill") || this.getStyle("cc-fill") || "black"
		let line =
			this.getStyle("cc-slider-line") || this.getStyle("cc-line") || "white"
		return {fill, line}
	}

	draw() {
		super.connectedCallback()
		if (this.disabled) {
			return
		}
		let [canvas, context] = [this.canvas, this.canvasContext]
		let height = canvas.height
		let width = canvas.width
		this.clear()
		let styles = this.styles
		let pixel =
			height - ((this.value - this.min) / (this.max - this.min)) * height

		context.fillStyle = styles.line
		context.fillRect(0, pixel, width, height - pixel)
	}
}

partyElements.define("cc-slider", CCSlider)
