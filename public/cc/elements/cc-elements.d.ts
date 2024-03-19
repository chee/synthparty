import CCXY from "./cc-xy"
import CCEditor from "./cc-editor"
import CCSlider from "./cc-slider"
import App from "./synth-party-app"

declare global {
	interface HTMLElementTagNameMap {
		"cc-xy": CCXY
		"cc-slider": CCSlider
		"cc-editor": CCEditor
		"synth-party": App
		dialog: HTMLDialogElement
	}
}
