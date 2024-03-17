import {partyElements} from "./party-elements.js"
import ControlChange from "./abstract-control-change.js"

let DPI = ControlChange.DPI

/** @type {AudioParam} */
export default class CCXY extends ControlChange {
	minX = 0
	minY = 0
	maxX = 127
	maxY = 127
	left = "left"
	right = "right"
	top = "top"
	bottom = "bottom"

	static create(
		/** @type {{
			x: number
			y: number
			left?: string
			right?: string
			top?: string
			bottom?: string
			label: string
		}} */
		{x, y, left, right, top, bottom, label}
	) {
		let element = /** @type {CCXY} */ (document.createElement("cc-xy"))
		element.ccX = x
		element.ccY = y

		if (left) {
			element.left = left
		}
		if (right) {
			element.right = right
		}
		if (top) {
			element.top = top
		}
		if (bottom) {
			element.bottom = bottom
		}
		element.label.textContent = label
		return element
	}

	get x() {
		return this.gainX.value
	}

	get y() {
		return this.gainY.value
	}

	set x(val) {
		this.gainX.setValueAtTime(val, this.audioContext.currentTime)
	}

	set y(val) {
		this.gainY.setValueAtTime(val, this.audioContext.currentTime)
	}

	get dynamicRangeY() {
		return Math.abs(this.maxY - this.minY)
	}
	get dynamicRangeX() {
		return Math.abs(this.maxX - this.minX)
	}

	setPropsFromAttributes() {
		if (this.hasAttribute("cc-x")) {
			this.ccX = +this.getAttribute("cc-x")
		}
		if (this.hasAttribute("cc-y")) {
			this.ccY = +this.getAttribute("cc-y")
		}
		if (this.hasAttribute("min-x")) {
			this.minX = +this.getAttribute("min-x")
		}
		if (this.hasAttribute("max-x")) {
			this.maxX = +this.getAttribute("max-x")
		}
		if (this.hasAttribute("min-y")) {
			this.minY = +this.getAttribute("min-y")
		}
		if (this.hasAttribute("max-y")) {
			this.maxY = +this.getAttribute("max-y")
		}
		if (this.hasAttribute("left")) {
			this.left = this.getAttribute("left")
		}
		if (this.hasAttribute("right")) {
			this.right = this.getAttribute("right")
		}
		if (this.hasAttribute("top")) {
			this.top = this.getAttribute("top")
		}
		if (this.hasAttribute("bottom")) {
			this.bottom = this.getAttribute("bottom")
		}
	}

	connectedCallback() {
		super.connectedCallback()
		this.setPropsFromAttributes()
		this.nodeX = new GainNode(this.audioContext)
		this.nodeY = new GainNode(this.audioContext)
		this.gainX = this.nodeX.gain
		this.gainY = this.nodeY.gain

		this.x = (this.maxX - this.minX) / 2

		this.y = (this.maxY - this.minY) / 2

		this.xAnalyzer = new AnalyserNode(this.audioContext, {
			fftSize: 2048
		})
		this.yAnalyzer = new AnalyserNode(this.audioContext, {
			fftSize: 2048
		})
		this.nodeX.connect(this.xAnalyzer)
		this.nodeY.connect(this.yAnalyzer)
		this.draw()
		this.party.when("tick", () => {
			this.tick()
		})
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
			if (cc == this.ccX) {
				this.x = value
				this.draw()
			}
			if (cc == this.ccY) {
				this.y = value
				this.draw()
			}
		}
	}

	/**
	 * @param {import("./abstract-control-change.js").MouseMessage} message
	 */
	mouse(message) {
		let {mouse, event} = message

		if (!event.altKey) {
			let x = Math.round((mouse.x / this.canvas.width) * this.maxX + this.minX)
			this.x = x
			this.announce("x", this.x)
			this.announce("send-midi", [[0xb0, this.ccX, this.x]])
		}
		if (!event.shiftKey) {
			let y =
				this.maxY -
				Math.round((mouse.y / this.canvas.height) * this.maxY + this.minY)
			this.y = y
			this.announce("y", this.y)
			this.announce("send-midi", [[0xb0, this.ccY, this.y]])
		}

		this.draw()
	}

	tick() {}

	get styles() {
		let fill =
			this.getStyle("cc-mix-fill") || this.getStyle("cc-fill") || "black"
		let line =
			this.getStyle("cc-mix-line") || this.getStyle("cc-line") || "white"
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

		let pixelX = (this.x / this.dynamicRangeX) * width
		let pixelY = ((this.maxY - this.y) / this.maxY - this.minY) * height
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
