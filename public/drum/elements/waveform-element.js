import {partyElements} from "./party-elements.js"
import DelugeEditor from "./editor-element.js"

const DPI = DelugeEditor.DPI
export default class DelugeWaveform extends DelugeEditor {
	constructor() {
		super()
		let canvas = document.createElement("canvas")
		this.drawingRegionCanvas = canvas
		this.drawingRegionContext = canvas.getContext("2d")
		canvas.style.height = this.canvas.style.height
		canvas.style.width = this.canvas.style.width
		this.shadowRoot.appendChild(canvas)
		this.style.position = "relative"
		canvas.style.position = "absolute"
		canvas.style.top =
			canvas.style.left =
			canvas.style.bottom =
			canvas.style.right =
				"0"
		canvas.height = this.height * DPI
		canvas.width = this.width * DPI
	}
	/** @param {import("./editor-element.js").MouseMessage} message */
	mouse(message) {
		let {type, mouse} = message
		if (type == "start") {
			this.startDrawingRegion(mouse.x)
		} else if (type == "move") {
			this.drawingRegionX = mouse.x
			this.drawRegion()
		} else {
			this.finishDrawingRegion(mouse.x)
		}
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
		super.clear()
		this.clearDrawingRegion()
	}

	clearDrawingRegion() {
		this.drawingRegionContext.clearRect(
			0,
			0,
			this.drawingRegionCanvas.width,
			this.drawingRegionCanvas.height
		)
	}

	draw() {
		if (this.parentSoundElement.editor != "waveform") {
			return
		}
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
		if (this.sound.reversed) {
			pixelStart = canvas.width - pixelStart
			pixelEnd = canvas.width - pixelEnd
			;[pixelStart, pixelEnd] = [pixelEnd, pixelStart]
		}

		context.fillStyle = styles.off
		context.fillRect(0, 0, pixelStart, canvas.height)

		context.fillStyle = styles.off
		context.fillRect(pixelEnd, 0, canvas.width, canvas.height)

		this.drawSampleLine({
			samples: this.sound.reversed ? samples.toReversed() : samples,
			x: 0,
			xm
		})

		context.fillStyle = styles.start
		context.fillRect(pixelStart, 0, 4, canvas.height)
		context.fillStyle = styles.end
		context.fillRect(pixelEnd, 0, 4, canvas.height)
	}

	drawRegion() {
		this.clearDrawingRegion()
		if (this.regionIsBeingDrawn) {
			this.drawingRegionContext.fillStyle = "#00ffcc66"
			let start = this.drawingRegionStart
			let end = this.drawingRegionX
			if (start > end) {
				;[start, end] = [end, start]
			}
			this.drawingRegionContext.fillRect(
				start,
				0,
				end - start,
				this.drawingRegionCanvas.height
			)
		}
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
		if (this.sound.reversed) {
			;[start, end] = [
				this.sound.audiobuffer.length - end,
				this.sound.audiobuffer.length - start
			]
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
	drawSampleLine({samples, x, xm}) {
		let [canvas, context] = [this.canvas, this.context]
		context.beginPath()
		context.strokeStyle = this.styles.line
		context.lineWidth = DelugeWaveform.DPI

		// Safari's canvas is so slow when drawing big paths.
		// would be nice to drop some accuracy on massive samples
		// would be nicer if this was based on the length of the sample
		let step =
			Math.ceil(
				(samples.length /
					(this.sound.audiobuffer.sampleRate *
						this.sound.audiobuffer.numberOfChannels)) **
					2
			) + 16
		for (let sample = 0; sample < samples.length; sample += step) {
			x += xm * step
			context.lineTo(
				x,
				canvas.height -
					(samples[sample] * this.getYMultiplier(context) +
						this.getZeroPoint(context))
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
		return context.canvas.height * (1 / verticalDistance)
	}
}

partyElements.define("deluge-waveform", DelugeWaveform)
