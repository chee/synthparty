import {partyElements} from "./party-elements.js"
import DelugeEditor from "./editor-element.js"

let DPI = DelugeEditor.DPI

export default class DelugeMix extends DelugeEditor {
	/** @param {import("./editor-element.js").MouseMessage} message */
	mouse(message) {
		let {type, mouse} = message
		if (type == "start") {
			// this.startDrawingRegion(mouse.x)
		} else if (type == "move") {
			// this.drawingRegionX = mouse.x
			this.draw()
		} else {
			// this.finishDrawingRegion(mouse.x)
		}
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
		let [canvas, context] = [this.canvas, this.context]
		this.clear()
		let styles = this.styles
	}
}

partyElements.define("deluge-mix", DelugeMix)
