import {Encoder} from "/libraries/audio-buffer-to-wav.js"

let html = document.documentElement

window.addEventListener("dragenter", async event => {
	event.preventDefault()
	let {items} = event.dataTransfer
	for (let item of Array.from(items)) {
		if (item.kind == "file") {
			html.setAttribute("drop-target", "drop-target")
		}
	}
})
window.addEventListener("dragover", async event => {
	event.preventDefault()
	let {items} = event.dataTransfer
	for (let item of Array.from(items)) {
		if (item.kind == "file") {
			html.setAttribute("drop-target", "")
		}
	}
})
window.addEventListener("dragleave", async event => {
	event.preventDefault()
	html.removeAttribute("drop-target")
})

window.addEventListener("drop", async event => {
	html.removeAttribute("drop-target")
	if (event.dataTransfer.items) {
		event.preventDefault()
		let sounds = []
		let [item] = event.dataTransfer.items
		let file = item.getAsFile()
		create(file)
	}
})

let fileInput = /** @type {HTMLInputElement} */ (
	document.getElementById("file")
)

fileInput?.addEventListener(
	"change",
	/** @type {InputEvent} */ event => {
		let [file] = fileInput.files || []
		create(file)
	}
)

export function encodeWAV(samples, sampleRate, numChannels) {
	let bytesPerSample = 2
	let blockAlign = numChannels * bytesPerSample
	let samplelength = samples.length * bytesPerSample
	let headerlength = 44

	let bufferlength = headerlength + samplelength
	let encoder = new Encoder(bufferlength, {littleEndian: true})

	// RIFF identifier
	encoder.string("RIFF")
	// RIFF chunk length (less the 8 bytes of "RIFF" and itself)
	encoder.uint32(bufferlength - 8)
	// RIFF type
	encoder.string("WAVE")
	// format chunk identifier
	encoder.string("fmt ")
	// format chunk length
	encoder.uint32(16)
	// sample format (raw)
	encoder.uint16(1)
	// channel count
	encoder.uint16(numChannels)
	// sample rate
	encoder.uint32(sampleRate)
	// byte rate (sample rate * block align)
	encoder.uint32(sampleRate * blockAlign)
	// block align (channel count * bytes per sample)
	encoder.uint16(blockAlign)
	// bits per sample
	encoder.uint16(8 * bytesPerSample)

	// data chunk identifier
	encoder.string("data")
	// data chunk length
	encoder.uint32(samplelength)
	for (let sample of samples) {
		encoder.uint16(sample)
	}

	return encoder.end()
}

let anchor = /** @type {HTMLAnchorElement} */ (document.getElementById("a"))
let audioElement = /** @type {HTMLAudioElement} */ (
	document.getElementById("audio")
)

/** @param {File} file */
async function create(file) {
	let samples = await file.arrayBuffer()
	samples.slice(200)
	let f16s = new Int16Array(samples.slice(0x200))
	let wav = encodeWAV(f16s, 44100, 2)
	let blob = new Blob([wav])
	anchor.href = URL.createObjectURL(blob)
	audioElement.src = anchor.href
	anchor.hidden = false
	audioElement.hidden = false
	let name = file.name.replace(/\.[a-zA-Z0-0]+$/, ".wav")
	anchor.download = name
	anchor.textContent = `download ${name}`
}
