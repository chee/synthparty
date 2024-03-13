import {partyElements, PartyElement} from "./party-elements.js"
import Sound from "../sound.js"

export default class DelugeWaveform extends PartyElement {
	static DPI = 4
	/** @type Sound */
	#sound

	constructor() {
		super()
		let canvas = document.createElement("canvas")
		this.canvas = canvas
		this.context = canvas.getContext("2d")
		this.attachShadow({mode: "open"})
		this.shadowRoot.appendChild(this.canvas)
		canvas.style.height = "5em"
		canvas.style.width = "400px"
		this.addEventListener("mousedown", this.#mousedown)
	}

	/** @param {MouseEvent} event */
	#mousedown(event) {
		// assumes nothing ever changes size while you're trying to trim a sample
		let bounds = this.canvas.getBoundingClientRect()
		let mouse = resolveMouseFromEvent(event, bounds)
		this.#mouse({type: "start", mouse})
		/** @param {MouseEvent} event */
		let mousemove = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.#mouse({type: "move", mouse})
		}
		window.addEventListener("mousemove", mousemove)

		/** @param {MouseEvent} event */
		let mouseend = event => {
			let mouse = resolveMouseFromEvent(event, bounds)
			this.#mouse({type: "end", mouse})
			window.removeEventListener("mousemove", mousemove)
		}

		window.addEventListener("mouseup", mouseend, {once: true})
	}

	/** @param {{
		type: "start" | "move" | "end",
		mouse: {x: number, y: number}
	} | {
	  type: "start" | "move" | "end",
	  mouse: {x: number, y: number}
	}} message */
	#mouse(message) {
		let {type, mouse} = message
		if (type == "start") {
			this.startDrawingRegion(mouse.x)
		} else if (type == "move") {
			this.drawingRegionX = mouse.x
		} else {
			this.finishDrawingRegion(mouse.x)
		}
	}

	get empx() {
		let box = document.createElement("div")
		box.style.width = "1em"
		box.style.visibility = "hidden"
		this.shadowRoot.appendChild(box)
		let empx = box.clientWidth
		this.shadowRoot.removeChild(box)
		return empx
	}

	get width() {
		return this.clientWidth
	}

	get height() {
		return this.empx * DelugeWaveform.DPI
	}

	connectedCallback() {
		this.canvas.width = this.width * DelugeWaveform.DPI
		this.canvas.height = this.height * DelugeWaveform.DPI
	}

	/** @type {Sound} */
	get sound() {
		return this.#sound
	}

	set sound(sound) {
		this.#sound = sound
		this.draw()
	}

	/** @param {string} prop */
	getStyle(prop) {
		return getComputedStyle(this).getPropertyValue("--" + prop)
	}

	get styles() {
		let fill = this.getStyle("waveform-fill") || "#000"
		let off = this.getStyle("waveform-off") || "#999"
		let line = this.getStyle("waveform-line") || "black"
		let start = this.getStyle("waveform-start") || "#f00"
		let end = this.getStyle("waveform-end") || "#0f0"
		return {fill, line, start, end, off}
	}

	clear() {
		let [canvas, context] = [this.canvas, this.context]
		let {width, height} = canvas
		context.restore()
		context.fillStyle = context.strokeStyle = this.styles.fill
		context.clearRect(0, 0, width, height)
		context.lineWidth = DelugeWaveform.DPI
	}

	draw() {
		let [canvas, context] = [this.canvas, this.context]
		this.clear()

		let styles = this.styles

		let samples = this.sound.mono()

		let xm = canvas.width / samples.length
		this.drawingRegionXMultiplier = xm

		let start = this.sound.start
		let end = this.sound.end
		let pixelStart = start * xm
		let pixelEnd = end * xm - 4

		context.fillStyle = styles.off
		context.fillRect(0, 0, pixelStart, canvas.height)

		context.fillStyle = styles.off
		context.fillRect(pixelEnd, 0, canvas.width, canvas.height)

		this.drawSampleLine({samples, x: 0, xm})

		let flip = this.sound.reversed
		context.fillStyle = flip ? styles.end : styles.start
		context.fillRect(pixelStart, 0, 4, canvas.height)
		context.fillStyle = flip ? styles.start : styles.end
		context.fillRect(pixelEnd, 0, 4, canvas.height)
	}

	drawingRegionStart = 0
	drawingRegionX = 0
	drawingRegionEnd = 0
	drawingRegionXMultiplier = 0

	get regionIsBeingDrawn() {
		return this.drawingRegionStart != -1 && this.drawingRegionEnd == -1
	}

	/** @param {number} x */
	startDrawingRegion(x) {
		this.drawingRegionStart = x
		this.drawingRegionX = x
		this.drawingRegionEnd = -1
	}

	/** @param {number} end */
	finishDrawingRegion(end) {
		let start = this.drawingRegionStart
		let m = this.drawingRegionXMultiplier

		;[start, end] = [start / m, end / m]
		if (start > end) {
			;[start, end] = [end, start]
		}
		if ((start | 0) == (end | 0)) {
			;[start, end] = [0, this.sound.audiobuffer.length]
		}
		this.sound.start = Math.floor(start)
		this.sound.end = Math.floor(end)
		this.drawingRegionStart = 0
		this.drawingRegionEnd = 0
		this.drawingRegionX = 0
		this.draw()
	}

	/**
	 * @typedef {Object} DrawSampleLineArguments
	 * @prop {Float32Array} samples
	 * @prop {number} x
	 * @prop {number} xm
	 * @param {DrawSampleLineArguments} args
	 */
	drawSampleLine({samples, x}) {
		let [canvas, context] = [this.canvas, this.context]
		context.beginPath()
		context.strokeStyle = this.styles.line
		context.lineWidth = DelugeWaveform.DPI
		let step = canvas.width / samples.length

		// Safari's canvas is so slow when drawing big paths. drop some accuracy
		// TODO make this a percentage of the overall samplesize
		let skip = 64
		for (let sample = 0; sample < samples.length; sample += skip) {
			let avg =
				samples.subarray(sample, sample + skip).reduce((a, b) => a + b) / skip
			x += step
			context.lineTo(
				x * skip,
				canvas.height -
					(avg * this.getYMultiplier(context) + this.getZeroPoint(context))
			)
		}
		context.stroke()
		return x
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 */
	getZeroPoint(context) {
		return context.canvas.height / 2
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 */
	getYMultiplier(context) {
		let verticalDistance = 2
		return context.canvas.height * (1 / verticalDistance) * 1.25
	}
}

partyElements.define("deluge-waveform", DelugeWaveform)

/**
 * @param {{x: number, y: number}} clientXY
 * @param {DOMRect} bounds
 * @returns {{x: number, y: number}} corrected
 */
function resolveMouse(clientXY, bounds) {
	return {
		x:
			clientXY.x < bounds.left
				? 0
				: // the bounds are the effective size
					clientXY.x > bounds.right
					? bounds.width * DelugeWaveform.DPI
					: // multiplied for the REAL canvas size
						(clientXY.x - bounds.left) * DelugeWaveform.DPI,
		y:
			clientXY.y < bounds.top
				? 0
				: clientXY.y > bounds.bottom
					? bounds.height * DelugeWaveform.DPI
					: (clientXY.y - bounds.top) * DelugeWaveform.DPI
	}
}

/**
 * @param {MouseEvent | Touch} event
 * @param {DOMRect} bounds
 */
function resolveMouseFromEvent(event, bounds) {
	return resolveMouse(
		{
			x: event.clientX,
			y: event.clientY
		},
		bounds
	)
}
