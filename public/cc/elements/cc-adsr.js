import {partyElements} from "/elements/party-elements.js"
import ControlChange from "./abstract-control-change.js"
import {clamp} from "../lib/number.js"

let DPI = ControlChange.DPI

/**
 * @extends {ControlChange<{}>}
 */
export default class CCADSR extends ControlChange {
	attack = 0
	decay = 0
	sustain = 0
	release = 0
	low = 0
	high = 127
	ccAttack = -1
	ccDecay = -1
	ccSustain = -1
	ccRelease = -1

	static form = {
		label: {
			label: "name",
			props: {
				type: "text",
				required: true
			}
		},
		ccAttack: {
			label: "cc number for attack",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		},
		ccDecay: {
			label: "cc number for sustain",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		},
		ccSustain: {
			label: "cc number for sustain",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		},
		ccRelease: {
			label: "cc number for release",
			props: {
				min: 0,
				max: 127,
				type: "number",
				required: true
			}
		}
	}

	setPropsFromAttributes() {
		if (this.hasAttribute("cc-a")) {
			this.ccAttack = +(this.getAttribute("cc-a") || -1)
		}
		if (this.hasAttribute("cc-d")) {
			this.ccDecay = +(this.getAttribute("cc-d") || -1)
		}
		if (this.hasAttribute("cc-s")) {
			this.ccSustain = +(this.getAttribute("cc-s") || -1)
		}
		if (this.hasAttribute("cc-r")) {
			this.ccRelease = +(this.getAttribute("cc-r") || -1)
		}
	}

	connectedCallback() {
		super.connectedCallback()
		this.setPropsFromAttributes()
		this.attack = 20
		this.decay = 20
		this.sustain = 20
		this.release = 20
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
			if (cc == this.ccAttack) {
				this.attack = value
				this.draw()
			}
			if (cc == this.ccDecay) {
				this.decay = value
				this.draw()
			}
			if (cc == this.ccSustain) {
				this.sustain = value
				this.draw()
			}
			if (cc == this.ccRelease) {
				this.release = value
				this.draw()
			}
		}
	}

	/** @type {"a" | "ds" | "r" | null} */
	state = null

	/**
	 * @param {import("./abstract-control-change.js").MouseMessage["mouse"]} mouse
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 */
	mouseWithinSpot(mouse, x, y) {
		return (
			mouse.x > x - this.handleSize * 2 && mouse.x < x + this.handleSize * 2 //&&
			// mouse.y > y - this.handleSize * 2 &&
			// mouse.y < y + this.handleSize * 2
		)
	}

	/**
	 * @param {import("./abstract-control-change.js").MouseMessage["mouse"]} mouse
	 * @returns {"a" | "ds" | "r" | null}
	 */
	mouseState(mouse) {
		if (mouse.x <= this.attackX + this.handleSize) {
			return "a"
		} else if (mouse.x < this.releaseStartX + this.handleSize) {
			return "ds"
		} else {
			return "r"
		}
	}

	/**
	 * @param {import("./abstract-control-change.js").MouseMessage} message
	 */
	mouse(message) {
		let {mouse, event, type} = message

		if (type == "start") {
			this.state = this.mouseState(mouse)
		}

		if (type == "move" && this.state) {
			let {width, height} = this.canvas
			let {x, y} = mouse

			let {high, low} = this

			let xd = (mouse.xd / (width / 4 / DPI)) * this.diff + low
			let yd = (mouse.yd / (height / 4)) * this.diff + low
			if (this.state == "a") {
				// console.log((mouse.xd / width) * this.diff + low + this.attack)
				let attack = xd + this.attack
				// todo why not a setter that auto sends midi
				this.attack = Math.round(clamp(low, attack, high))
				this.announce("send-midi", [[0xb0, this.ccAttack, this.attack]])
			}
			if (this.state == "ds") {
				let decay = xd + this.decay
				this.decay = clamp(low, decay, high)
				let sus = yd + this.sustain
				this.sustain = Math.round(clamp(low, sus, high))
				this.announce("send-midi", [[0xb0, this.ccDecay, this.decay]])
				this.announce("send-midi", [[0xb0, this.ccSustain, this.sustain]])
			}
			if (this.state == "r") {
				let release = xd + this.release
				this.release = Math.round(clamp(low, release, high))
				this.announce("send-midi", [[0xb0, this.ccRelease, this.release]])
			}
		}

		if (type == "end") {
			this.state = null
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

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	drawSpot(x, y) {
		this.canvasContext.beginPath()
		this.canvasContext.fillStyle = this.styles.line
		this.canvasContext.arc(x, y, this.handleSize, 0, 2 * Math.PI)
		this.canvasContext.fill()
		this.canvasContext.stroke()
		this.canvasContext.beginPath()
		this.canvasContext.moveTo(x, y)
	}

	draw() {
		super.scaleCanvasForDPI()
		if (this.disabled) {
			return
		}
		let [canvas, context] = [this.canvas, this.canvasContext]
		let {height} = canvas
		this.clear()
		let styles = this.styles

		let attackX = this.attackX
		context.strokeStyle = styles.line
		context.lineWidth = DPI * 2
		context.beginPath()
		context.moveTo(0, height)
		context.bezierCurveTo(
			attackX / 2,
			this.handleSize,
			attackX,
			this.handleSize,
			attackX,
			this.handleSize
		)
		context.stroke()
		this.drawSpot(this.attackX, this.handleSize)
		let decayX = this.decayX
		let sustainY = this.sustainY
		context.bezierCurveTo(
			attackX,
			sustainY,
			decayX,
			sustainY,
			decayX,
			sustainY
		)
		context.stroke()
		this.drawSpot(decayX, sustainY)
		let releaseStartX = this.releaseStartX
		context.stroke()
		context.beginPath()
		context.setLineDash([10])
		context.moveTo(decayX, sustainY)
		context.lineTo(releaseStartX, sustainY)
		context.stroke()
		context.beginPath()
		context.moveTo(releaseStartX, sustainY)
		context.setLineDash([])
		let releaseEndX = this.releaseEndX

		let releaseDiffX = releaseEndX - releaseStartX
		context.bezierCurveTo(
			releaseStartX,
			sustainY,

			releaseStartX + releaseDiffX / 2,
			canvas.height - this.handleSize,

			releaseEndX,
			canvas.height - this.handleSize
		)
		context.stroke()
		this.drawSpot(releaseEndX, canvas.height - this.handleSize)
	}

	get handleSize() {
		return 20
		// return this.canvas.width / (this.high - this.low)
	}

	get attackX() {
		return this.calculateX(this.attack) / 4
	}

	get decayX() {
		return this.attackX + this.calculateX(this.decay) / 4
	}

	get sustainY() {
		let scaled = this.scale(this.sustain)
		let height = this.canvas.height - this.handleSize * 2
		return height - height * scaled + this.handleSize
	}

	get releaseStartX() {
		return this.canvas.width / 2
	}

	get releaseEndX() {
		return this.releaseStartX + this.calculateX(this.release) / 4
	}

	get diff() {
		return this.high - this.low
	}

	scale(/** @type number */ val) {
		return (val - this.low) / this.diff
	}

	calculateX(val) {
		return this.scale(val) * this.canvas.width
	}
}

partyElements.define("cc-adsr", CCADSR)
