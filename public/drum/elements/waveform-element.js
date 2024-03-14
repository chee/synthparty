import {partyElements} from "./party-elements.js"
import DelugeEditor from "./editor-element.js"

export default class DelugeWaveform extends DelugeEditor {
	/** @param {import("./editor-element.js").MouseMessage} message */
	mouse(message) {
		let {type, mouse} = message
		if (type == "start") {
			this.startDrawingRegion(mouse.x)
		} else if (type == "move") {
			this.drawingRegionX = mouse.x
			this.draw()
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

		if (this.regionIsBeingDrawn) {
			context.fillStyle = "#00ffcc66"
			let start = this.drawingRegionStart
			let end = this.drawingRegionX
			if (start > end) {
				;[start, end] = [end, start]
			}
			context.fillRect(start, 0, end - start, canvas.height)
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
