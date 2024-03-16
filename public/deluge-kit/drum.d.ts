import DelugeKit from "./elements/kit-element"
import DelugeButton from "./elements/button-element"
import DelugeSound from "./elements/sound-element"

declare global {
	interface HTMLElementTagNameMap {
		"deluge-kit": DelugeKit
		"deluge-button": DelugeButton
		"deluge-sound": DelugeSound
		dialog: HTMLDialogElement
	}
}
