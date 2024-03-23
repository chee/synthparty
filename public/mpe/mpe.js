import "/elements/midi-port.js"
import "./elements/mpe-keyboard.js"
import {partyElements, PartyElement} from "/elements/party-elements.js"
import {MIDIMessage} from "/libraries/midi.js"

/**
 * @typedef {import("/elements/midi-port.js").MIDIPortElementEventMap} MIDIPortElementEventMap
 * @typedef {import("./elements/mpe-keyboard").MPEKeyboardElementEventMap} MPEKeyboardElementEventMap
 */

/** @extends {PartyElement<{} & MIDIPortElementEventMap & MPEKeyboardElementEventMap>} */
class MPEApp extends PartyElement {
	midi = {
		/** @type {MIDIInput?} */
		input: null,
		/** @type {MIDIOutput?} */
		output: null
	}
	connectedCallback() {
		this.when("midiinputdevice", this.setMIDIDevice)
		this.when("midioutputdevice", this.setMIDIDevice)
		this.querySelector("#train")?.addEventListener("click", () => {
			for (let i = 1; i < 16; i++) {
				this.midi.output?.send([MIDIMessage.NoteOn | i, i + 48, 64])
			}
			setTimeout(() => {
				for (let i = 1; i < 16; i++) {
					this.midi.output?.send([MIDIMessage.NoteOff | i, i + 48, 64])
				}
			}, 4000)
		})
	}

	/** @param {MIDIInput|MIDIOutput} device */
	setMIDIDevice = device => {
		if (device instanceof MIDIInput) {
			this.midi.input = device
		} else if (device instanceof MIDIOutput) {
			this.midi.output = device
			this.querySelector("mpe-keyboard").output = device
		}
	}
}

partyElements.define("mpe-app", MPEApp)
partyElements.register()
