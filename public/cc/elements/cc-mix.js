import {partyElements} from "./party-elements.js"
import AbstractControlChange from "./abstract-control-change.js"

let DPI = AbstractControlChange.DPI

export default class ControlChangeMix extends AbstractControlChange {
	dynamicRange = 100
	disabled = false
	pan = 0
	volume = 100
	/** @param {import("./abstract-control-change.js").MouseMessage} message */
	mouse(message) {
		let {mouse} = message
		this.pan = (mouse.x / this.canvas.width) * this.dynamicRange
		this.volume =
			this.dynamicRange -
			Math.round((mouse.y / this.canvas.height) * (this.dynamicRange + 1))
		this.announce("pan", this.pan)
		this.announce("volume", this.volume)

		this.draw()
	}

	get styles() {
		let fill = this.getStyle("cc-mix-fill") || "black"
		let line = this.getStyle("cc-mix-line") || "white"
		return {fill, line}
	}

	draw() {
		super.connectedCallback()
		if (this.disabled) {
			return
		}
		let [canvas, context] = [this.canvas, this.context]
		let height = canvas.height
		let width = canvas.width
		this.clear()
		let styles = this.styles
		let volumeY =
			((this.dynamicRange - this.volume) / this.dynamicRange) * height
		let panX = (this.pan / this.dynamicRange) * width
		context.strokeStyle = styles.line
		context.lineWidth = DPI * 2
		context.beginPath()
		context.arc(panX, volumeY, 20, 0, 2 * Math.PI)
		context.stroke()
		context.lineWidth = DPI
		context.strokeStyle = "#fff"

		// horizontal line
		// left side
		context.beginPath()
		context.moveTo(0, height / 2)
		context.lineTo(panX, volumeY)
		context.stroke()
		// right side
		context.beginPath()
		context.moveTo(panX, volumeY)
		context.lineTo(width, height / 2)
		context.stroke()
		// vertical line
		context.beginPath()
		context.moveTo(width / 2, 0)
		// loud side
		context.strokeStyle = "#fff"
		context.lineTo(panX, volumeY)
		context.stroke()
		// quiet side
		context.beginPath()
		context.moveTo(panX, volumeY)
		context.strokeStyle = "#fff"
		context.lineTo(width / 2, height)
		context.stroke()

		context.font = "50px qp, monospace"
		context.fillStyle = styles.fill || "white"
		context.strokeStyle = styles.line || "white"

		context.textAlign = "left"
		context.textBaseline = "middle"
		context.fillText("left ear", 0, height / 2)

		context.textAlign = "right"
		context.textBaseline = "middle"
		context.fillText("right ear", width, height / 2)

		context.textAlign = "center"
		context.textBaseline = "top"
		context.fillText("loud", width / 2, 0)

		context.textAlign = "center"
		context.textBaseline = "bottom"
		context.fillText("quiet", width / 2, height)
	}
}

partyElements.define("cc-mix", ControlChangeMix)
