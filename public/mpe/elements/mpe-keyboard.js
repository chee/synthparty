import {PartyElement, partyElements} from "/elements/party-elements.js"
import {scaleCanvasForDPI} from "/libraries/canvas.js"
import {clamp} from "/libraries/math.js"
import {
	MIDIControlChange,
	MIDIMessage,
	scaleBipolarTo14bit
} from "/libraries/midi.js"
import Pointer from "/libraries/pointer.js"

/**
 * @typedef {Object} MPEKeyboardElementEventMap
 * @prop {number[]} send-midi
 */

const DPI = 4

/**
 * @abstract
 * @template {import("/elements/party-elements.js").PartyEventMap} E
 * @extends {PartyElement<E & MPEKeyboardElementEventMap>}
 */

export default class MPEKeyboard extends PartyElement {
	disabled = false
	static css = `
		* {
			box-sizing: border-box;
			--webkit-user-select: none;
			-webkit-touch-callout: none;
			-webkit-user-select: none;
			-khtml-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
			-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
			touch-action: manipulation;
		}

		figure {
			display: flex;
			flex-direction: column;
			margin: 0;
			gap: 4px;
			align-items: center;
			background: white;
			border: 1px solid;
			padding: 4px;
			box-shadow: 0 0 10px #00000011;
		}

		figcaption {
			grid-area: label;
			border: 0px solid;
			background: white;
			text-align: center;
			padding: 2px;
			font-size: 16px;
		}

		#canvas-container {
			border: 2px solid;
			border-top: 0;
			grid-area: canvas;
			height: var(--height);
			width: var(--width);
		}

		canvas {
			height: 100%;
			width: 100%;
			touch-action: none;
		}
`

	/** @type {MIDIOutput?} */
	output = null

	labelElement = document.createElement("figcaption")

	/** @param {string} value */
	set label(value) {
		this.labelElement.textContent = value
	}

	get label() {
		return this.labelElement.textContent || ""
	}

	static get stylesheet() {
		let stylesheet = new CSSStyleSheet()
		stylesheet.replaceSync(MPEKeyboard.css)
		return stylesheet
	}

	constructor() {
		super()
		let figure = document.createElement("figure")
		this.attachShadow({mode: "open"})
		this.shadowRoot?.appendChild(figure)
		this.labelElement.textContent = this.getAttribute("label")

		let container = document.createElement("div")
		container.id = "canvas-container"
		let canvas = document.createElement("canvas")
		this.canvas = canvas
		this.canvasContext = /** @type {CanvasRenderingContext2D} */ (
			canvas.getContext("2d")
		)

		container.append(canvas)
		figure.append(container)
		figure.appendChild(this.labelElement)
		this.shadowRoot &&
			(this.shadowRoot.adoptedStyleSheets = [MPEKeyboard.stylesheet])

		this.pointer = new Pointer({
			canvas,
			dpi: DPI,
			onstart: this.pointerstart,
			onmove: this.pointermove,
			onend: this.pointerend
		})
	}

	connectedCallback() {
		scaleCanvasForDPI(this.canvas, DPI)
		this.draw()
	}

	/** @type {Map<number, PointerNote>} */
	notes = new Map()

	/**
	 * @param {import("/libraries/pointer.js").MouserStartEndDetail} detail
	 */
	pointerstart = detail => {
		let {width, height} = this.canvas
		let {mouse, finger} = detail
		let id = finger ? finger.identifier : 0
		this.notes.set(id, new PointerNote(Math.floor(mouse.x / (width / 12)) + 1))
		let note = this.getNote(finger)
		note.y = Math.round(127 - mouse.y / (height / 127))
		this.output?.send(note.timbre())
		this.output?.send([(0xd << 4) | note.channel, 0])
		this.output?.send([MIDIMessage.PitchBend | note.channel, 0, 64])
		this.output?.send(note.on())
	}

	/**
	 * @param {import("/libraries/pointer.js").MouserMoveDetail} detail
	 */
	pointermove = detail => {
		let {mouse, finger} = detail
		let note = this.getNote(finger)
		let yd = Math.round(clamp(0, mouse.yd * 512 + note.y, 127))
		this.output?.send(note.bend(mouse.xd))
		this.output?.send(note.timbre(yd))
	}

	/**
	 * @param {import("/libraries/pointer.js").MouserStartEndDetail} detail
	 */
	pointerend = detail => {
		let {finger} = detail
		let note = this.getNote(finger)

		this.output?.send(note.off())
		this.deleteNote(finger)
	}

	/**
	 * @param {Touch} [finger]
	 */
	getNote(finger) {
		return /** @type {PointerNote} */ (
			this.notes.get(finger ? finger.identifier : 0)
		)
	}

	/**
	 * @param {Touch} [finger]
	 */
	deleteNote(finger) {
		this.notes.delete(finger ? finger.identifier : 0)
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
		context.fillStyle = this.styles.fill
		context && (context.strokeStyle = this.styles.fill)
		context.fillRect(0, 0, width, height)
		context.lineWidth = DPI
	}

	draw() {
		let [canvas, context] = [this.canvas, this.canvasContext]
		let {width, height} = canvas
		let numberOfGradients = 12
		let letters = "0123456789ABCDEF"

		for (let i = 0; i < numberOfGradients; i++) {
			let xStart = (i / numberOfGradients) * width
			let xEnd = ((i + 1) / numberOfGradients) * width

			let gradient = context.createLinearGradient(0, 0, xEnd - xStart, height)

			let colorStart = "#"
			let colorEnd = "#"
			for (let i = 0; i < 6; i++) {
				colorStart += letters[Math.floor(Math.random() * 16)]
				colorEnd += letters[Math.floor(Math.random() * 16)]
			}

			gradient.addColorStop(0, colorStart)
			gradient.addColorStop(1, colorEnd)

			context.fillStyle = gradient
			context.fillRect(xStart, 0, xEnd - xStart, height)
		}
	}
}

let scale = [
	61, 63, 64, 66, 68, 69, 71, 73, 75, 76, 78, 80, 81, 83, 85, 87, 88, 90, 92
]
class PointerNote {
	channel = -1
	note = -1
	y = -1
	constructor(channel = -1, y = -1) {
		this.channel = channel
		this.note = scale[channel - 1]

		this.y = y
	}

	on(velocity = 0x74) {
		return [MIDIMessage.NoteOn | this.channel, this.note, velocity]
	}

	off(velocity = 0x74) {
		return [MIDIMessage.NoteOff | this.channel, this.note, velocity]
	}

	timbre(y = this.y) {
		return [
			MIDIMessage.ControlChange | this.channel,
			MIDIControlChange.MPEY,
			y
		]
	}

	bend(bend = 0) {
		let [pbm, pbl] = scaleBipolarTo14bit(bend)
		return [MIDIMessage.PitchBend | this.channel, pbl, pbm]
	}
}

partyElements.define("mpe-keyboard", MPEKeyboard)
