import {partyElements} from "/elements/party-elements.js"
import ControlChange from "./abstract-control-change.js"

let DPI = ControlChange.DPI

/**
 * @extends {ControlChange<{"x": number, "y": number}>}
 */
export default class CCXY extends ControlChange {
	minX = 0
	minY = 0
	maxX = 127
	maxY = 127
	left = ""
	right = ""
	top = ""
	bottom = ""
	x = 0
	y = 0

	static form = {
		label: {
			label: "name",
			props: {
				type: "text",
				required: true
			}
		},
		ccX: {
			label: "cc number for x axis",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		},
		ccY: {
			label: "cc number for y axis",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		},
		left: {
			label: "label for left side",
			props: {
				type: "text"
			}
		},
		right: {
			label: "label for right side",
			props: {type: "text"}
		},
		top: {
			label: "label for top side",
			props: {type: "text"}
		},
		bottom: {
			label: "label for bottom side",
			props: {type: "text"}
		},
		minX: {
			label: "cc value at left side",
			props: {
				min: 0,
				max: 127,
				type: "number",
				value: 0
			}
		},
		maxX: {
			label: "cc value at right side",
			props: {
				min: 0,
				max: 127,
				type: "number",
				value: 127
			}
		},
		minY: {
			label: "cc value at top",
			props: {
				min: 0,
				max: 127,
				type: "number",
				value: 0
			}
		},
		maxY: {
			label: "cc value at bottom",
			props: {
				min: 0,
				max: 127,
				type: "number",
				value: 127
			}
		}
	}

	setPropsFromAttributes() {
		if (this.hasAttribute("cc-x")) {
			this.ccX = +(this.getAttribute("cc-x") || -1)
		}
		if (this.hasAttribute("cc-y")) {
			this.ccY = +(this.getAttribute("cc-y") || -1)
		}
		if (this.hasAttribute("min-x")) {
			this.minX = +(this.getAttribute("min-x") || -1)
		}
		if (this.hasAttribute("max-x")) {
			this.maxX = +(this.getAttribute("max-x") || -1)
		}
		if (this.hasAttribute("min-y")) {
			this.minY = +(this.getAttribute("min-y") || -1)
		}
		if (this.hasAttribute("max-y")) {
			this.maxY = +(this.getAttribute("max-y") || -1)
		}
		if (this.hasAttribute("left")) {
			this.left = this.getAttribute("left") || ""
		}
		if (this.hasAttribute("right")) {
			this.right = this.getAttribute("right") || ""
		}
		if (this.hasAttribute("top")) {
			this.top = this.getAttribute("top") || ""
		}
		if (this.hasAttribute("bottom")) {
			this.bottom = this.getAttribute("bottom") || ""
		}
	}

	connectedCallback() {
		super.connectedCallback()
		this.setPropsFromAttributes()
		this.x = (this.maxX - this.minX) / 2 + this.minX
		this.y = (this.maxY - this.minY) / 2 + this.minY
		this.draw()
		this.party?.when("tick", () => {
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
			let x = Math.round(
				(mouse.x / this.canvas.width) * (this.maxX - this.minX) + this.minX
			)
			this.x = x
			this.announce("x", this.x)
			this.announce("send-midi", [[0xb0, this.ccX, this.x]])
		}
		if (!event.shiftKey) {
			let y =
				this.maxY -
				Math.round((mouse.y / this.canvas.height) * (this.maxY - this.minY))

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
		super.scaleCanvasForDPI()
		if (this.disabled) {
			return
		}
		let [canvas, context] = [this.canvas, this.canvasContext]
		let height = canvas.height
		let width = canvas.width
		this.clear()
		let styles = this.styles

		let pixelX = ((this.x - this.minX) / (this.maxX - this.minX)) * width

		let pixelY =
			height - ((this.y - this.minY) / (this.maxY - this.minY)) * height

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
