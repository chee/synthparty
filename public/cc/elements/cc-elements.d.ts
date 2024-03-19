import CCXY from "./cc-xy"
import CCEditor from "./cc-editor"
import CCSlider from "./cc-slider"

declare global {
	interface HTMLElementTagNameMap {
		"cc-xy": CCXY
		"cc-slider": CCSlider
		"cc-editor": CCEditor
		dialog: HTMLDialogElement
	}
}
