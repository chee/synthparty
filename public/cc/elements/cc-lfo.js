import {partyElements} from "./party-elements.js"
import ControlChange from "./abstract-control-change.js"
import AbstractControlChange from "./abstract-control-change.js"

/** @type {AudioParam} */
export default class CCLFO extends ControlChange {
	min = 0
	max = 127

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
		shape: {
			label: "shape",
			props: {
				value: "sine",
				required: true
			}
		},
		frequency: {
			label: "speed",
			props: {
				type: "number"
			}
		}
		// min: {
		// 	label: "cc value at base",
		// 	props: {
		// 		min: 0,
		// 		max: 127,
		// 		type: "number"
		// 	}
		// },
		// max: {
		// 	label: "cc value at tip",
		// 	props: {
		// 		min: 0,
		// 		max: 127,
		// 		type: "number"
		// 	}
		// }
	}

	constructor() {
		super()
		this.value = (this.max - this.min) / 2
		this.draw()
		this.party.addEventListener("tick", this.tick)
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
			Math.round((mouse.y / this.canvas.height) * this.max + this.min)
		this.value = val
		// this.announce("value", val)
		// this.announce("send-midi", [[0xb0, this.cc, this.value]])

		this.draw()
	}

	tick = () => {
		this.draw()
	}

	get styles() {
		let fill =
			this.getStyle("cc-slider-fill") || this.getStyle("cc-fill") || "black"
		let line =
			this.getStyle("cc-slider-line") || this.getStyle("cc-line") || "white"
		return {fill, line}
	}

	draw() {
		// super.scaleCanvasForDPI()
		// if (this.disabled) {
		// 	return
		// }
		// let [canvas, context] = [this.canvas, this.canvasContext]
		// let height = canvas.height
		// let width = canvas.width
		// this.clear()
		// let styles = this.styles
		// context.lineWidth = AbstractControlChange.DPI * 4
		// context.strokeStyle = styles.line
		// let sliceWidth = width / this.analyzer.frequencyBinCount
		// this.analyzer.getByteTimeDomainData(this.analyzerBuffer)
		// {
		// 	for (let i = 1; i < this.analyzer.frequencyBinCount; i++) {
		// 		const v = this.analyzerBuffer[i] / 128.0
		// 		const y = (v * canvas.height) / 2
		// 		let x = i * sliceWidth
		// 		context.lineTo(x, y)
		// 	}
		// }
		// context.lineTo(width, height / 2)
		// context.stroke()
	}
}

partyElements.define("cc-lfo", CCLFO)
