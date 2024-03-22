import {partyElements, PartyElement} from "/elements/party-elements.js"
import Sample from "../sample.js"

const DPI = 4

export default class TransientSample extends PartyElement {
	/** @type Sample */
	#sample
	/** @type {HTMLElement}*/
	labelElement

	constructor() {
		super()
		this.$("#play").addEventListener("mousedown", () => {
			this.sample.noteOn()
			window.addEventListener(
				"mouseup",
				() => {
					this.sample.noteOff()
				},
				{once: true}
			)
		})

		let canvas = this.shadowRoot.querySelector("canvas")
		this.canvas = canvas
		this.canvasContext = canvas.getContext("2d")

		this.labelElement = /** @type {HTMLElement}*/ (
			this.shadowRoot.querySelector("figcaption")
		)
	}

	set label(value) {
		this.labelElement.textContent = value
	}

	get label() {
		return this.labelElement.textContent
	}

	get width() {
		return this.canvas.clientWidth
	}

	get height() {
		return this.canvas.clientHeight
	}

	/** @param {string} prop */
	getStyle(prop) {
		return getComputedStyle(this).getPropertyValue("--" + prop)
	}

	get styles() {
		let fill = this.getStyle("fill") || "#000"
		let line = this.getStyle("line") || "black"
		return {fill, line}
	}

	clear() {
		let [canvas, context] = [this.canvas, this.canvasContext]
		let {width, height} = canvas
		context.restore()
		context.fillStyle = context.strokeStyle = this.styles.fill
		context.fillRect(0, 0, width, height)
		context.lineWidth = DPI
	}

	scaleCanvasForDPI() {
		this.canvas.width = this.width * DPI
		this.canvas.height = this.height * DPI
	}

	draw() {
		let [canvas, context] = [this.canvas, this.canvasContext]
		this.clear()

		let styles = this.styles

		let samples = this.sample.mono()

		let xm = canvas.width / samples.length
		this.drawingRegionXMultiplier = xm

		let end = this.sample.audiobuffer.length
		let pixelStart = 0
		let pixelEnd = end * xm - 4

		context.fillStyle = styles.off
		context.fillRect(0, 0, pixelStart, canvas.height)

		context.fillStyle = styles.off
		context.fillRect(pixelEnd, 0, canvas.width, canvas.height)

		this.drawSampleLine({
			samples,
			x: 0,
			xm
		})
	}

	/**
	 * @typedef {Object} DrawSampleLineArguments
	 * @prop {Float32Array} samples
	 * @prop {number} x
	 * @prop {number} xm
	 * @param {DrawSampleLineArguments} args
	 */
	drawSampleLine({samples, x, xm}) {
		let [canvas, context] = [this.canvas, this.canvasContext]
		context.beginPath()
		context.strokeStyle = this.styles.line
		context.lineWidth = DPI

		// Safari's canvas is so slow when drawing big paths.
		// would be nice to drop some accuracy on massive samples
		// would be nicer if this was based on the length of the sample
		let step =
			Math.ceil(
				(samples.length /
					(this.sample.audiobuffer.sampleRate *
						this.sample.audiobuffer.numberOfChannels)) **
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

	/** @type {Sample} */
	get sample() {
		return this.#sample
	}

	set sample(sample) {
		this.#sample = sample
		// this.label = sample.name
		this.draw()
	}
}
partyElements.define("transient-sample", TransientSample)
