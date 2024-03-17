import {partyElements} from "./party-elements.js"
import ControlChange from "./abstract-control-change.js"

let DPI = ControlChange.DPI

/** @type {AudioParam} */
export default class CCXY extends ControlChange {
	xNode = new GainNode(this.audioContext)
	yNode = new GainNode(this.audioContext)
	xGain = this.xNode.gain
	yGain = this.yNode.gain

	get x() {
		return this.xGain.value
	}

	get y() {
		return this.yGain.value
	}

	get yDynamicRange() {
		return Math.abs(this.yMax - this.yMin)
	}
	get xDynamicRange() {
		return Math.abs(this.xMax - this.xMin)
	}

	connectedCallback() {
		super.connectedCallback()
		this.xCC = this.hasAttribute("x-cc") ? +this.getAttribute("x-cc") : 0
		this.yCC = this.hasAttribute("y-cc") ? +this.getAttribute("y-cc") : 0
		this.xMin = this.hasAttribute("x-min") ? +this.getAttribute("x-min") : 0
		this.xMax = this.hasAttribute("x-max") ? +this.getAttribute("x-max") : 127
		this.yMin = this.hasAttribute("y-min") ? +this.getAttribute("y-min") : 0
		this.yMax = this.hasAttribute("y-max") ? +this.getAttribute("y-max") : 127
		this.xGain.setValueAtTime(
			(this.xMax - this.xMin) / 2,
			this.audioContext.currentTime
		)
		this.yGain.setValueAtTime(
			(this.yMax - this.yMin) / 2,
			this.audioContext.currentTime
		)
		this.left = this.getAttribute("left") || "left"
		this.right = this.getAttribute("right") || "right"
		this.top = this.getAttribute("top") || "top"
		this.bottom = this.getAttribute("bottom") || "bottom"
		this.xAnalyzer = new AnalyserNode(this.audioContext, {
			fftSize: 2048
		})
		this.yAnalyzer = new AnalyserNode(this.audioContext, {
			fftSize: 2048
		})
		this.xNode.connect(this.xAnalyzer)
		this.yNode.connect(this.yAnalyzer)
		this.draw()
		this.party.when("tick", () => {
			this.tick()
		})
		this.announce("sub", this)
		// this.addEventListener("midimessage", console.debug)
	}

	/** @param {import("./abstract-control-change.js").MouseMessage} message */
	mouse(message) {
		let {mouse} = message

		let x = Math.round((mouse.x / this.canvas.width) * this.xMax + this.xMin)
		let y =
			this.yMax -
			Math.round((mouse.y / this.canvas.height) * this.yMax + this.yMin)
		this.xGain.setValueAtTime(x, this.audioContext.currentTime)
		this.yGain.setValueAtTime(y, this.audioContext.currentTime)

		this.announce("x", this.x)
		this.announce("y", this.y)
		this.announce("send-midi", [[0xb0, this.xCC, this.x]])
		this.announce("send-midi", [[0xb0, this.yCC, this.y]])
		this.draw()
	}

	tick() {}

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
		let [canvas, context] = [this.canvas, this.canvasContext]
		let height = canvas.height
		let width = canvas.width
		this.clear()
		let styles = this.styles

		let pixelX = (this.x / this.xDynamicRange) * width
		let pixelY = ((this.yMax - this.y) / this.yMax - this.yMin) * height
		context.strokeStyle = styles.line
		context.lineWidth = DPI * 2
		context.beginPath()
		context.arc(pixelX, pixelY, 20, 0, 2 * Math.PI)
		context.stroke()
		context.lineWidth = DPI
		context.strokeStyle = "#fff"

		// horizontal line
		// left side
		context.beginPath()
		context.moveTo(0, height / 2)
		context.lineTo(pixelX, pixelY)
		context.stroke()
		// right side
		context.beginPath()
		context.moveTo(pixelX, pixelY)
		context.lineTo(width, height / 2)
		context.stroke()
		// vertical line
		context.beginPath()
		context.moveTo(width / 2, 0)
		// loud side
		context.strokeStyle = "#fff"
		context.lineTo(pixelX, pixelY)
		context.stroke()
		// quiet side
		context.beginPath()
		context.moveTo(pixelX, pixelY)
		context.strokeStyle = "#fff"
		context.lineTo(width / 2, height)
		context.stroke()

		context.font = "50px qp, monospace"
		context.fillStyle = styles.line || "white"
		context.strokeStyle = styles.line || "white"

		context.textAlign = "left"
		context.textBaseline = "middle"
		context.fillText(this.left, 0, height / 2)

		context.textAlign = "right"
		context.textBaseline = "middle"
		context.fillText(this.right, width, height / 2)

		context.textAlign = "center"
		context.textBaseline = "top"
		context.fillText(this.top, width / 2, 0)

		context.textAlign = "center"
		context.textBaseline = "bottom"
		context.fillText(this.bottom, width / 2, height)
	}
}

partyElements.define("cc-xy", CCXY)
