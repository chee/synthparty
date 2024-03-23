import CCXY from "./cc-xy"
import CCEditor from "./cc-editor"
import CCADSR from "./cc-adsr"
import CCSlider from "./cc-slider"
import CCTape from "./cc-tape"
import App from "./synth-party-app"

declare global {
	interface HTMLElementTagNameMap {
		"cc-xy": CCXY
		"cc-slider": CCSlider
		"cc-editor": CCEditor
		"cc-adsr": CCADSR
		"cc-tape": CCTape
		"synth-party": App
		dialog: HTMLDialogElement
	}
}
