import {partyElements} from "./party-elements.js"
import DelugeEditor from "./editor-element.js"
import Sound from "../sound.js"

let DPI = DelugeEditor.DPI

export default class DelugeMix extends DelugeEditor {
	/** @param {import("./editor-element.js").MouseMessage} message */
	mouse(message) {
		let {mouse} = message
		this.sound.pan = Math.round(
			(mouse.x / this.canvas.width) * Sound.DynamicRange
		)

		this.sound.volume =
			Sound.DynamicRange -
			Math.round((mouse.y / this.canvas.height) * (Sound.DynamicRange + 1))

		this.draw()
	}

	get styles() {
		let fill = this.getStyle("mix-fill")
		let off = this.getStyle("mix-off")
		let line = this.getStyle("mix-line")
		let start = this.getStyle("mix-start")
		let end = this.getStyle("mix-end")
		return {fill, line, start, end, off}
	}

	draw() {
		super.connectedCallback()
		if (this.editorMode != "mix") {
			return
		}
		let [canvas, context] = [this.canvas, this.context]
		let height = canvas.height
		let width = canvas.width
		this.clear()
		let styles = this.styles
		let b = Sound.DynamicRange
		let h = height
		let w = width
		let quietY = ((b - this.sound.volume) / b) * h
		let panX = (this.sound.pan / b) * w
		context.strokeStyle = "white"
		context.strokeStyle = "#fff"
		context.lineWidth = DPI * 2
		context.beginPath()
		context.arc(panX, quietY, 20, 0, 2 * Math.PI)
		context.stroke()
		context.lineWidth = DPI
		context.strokeStyle = "#fff"

		// horizontal line
		// left side
		context.beginPath()
		context.moveTo(0, height / 2)
		context.lineTo(panX, quietY)
		context.stroke()
		// right side
		context.beginPath()
		context.moveTo(panX, quietY)
		context.lineTo(width, height / 2)
		context.stroke()
		// vertical line
		context.beginPath()
		context.moveTo(width / 2, 0)
		// loud side
		context.strokeStyle = "#fff"
		context.lineTo(panX, quietY)
		context.stroke()
		// quiet side
		context.beginPath()
		context.moveTo(panX, quietY)
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

partyElements.define("deluge-mix", DelugeMix)
