import {downloadZip} from "../deluge-kit/vendor/client-zip.js"
import TransientSample from "./elements/sample-element.js"
import Sample from "./sample.js"
let context = new AudioContext()
let name = "transients"
import {init} from "./elements/init.js"
init()

/** @type {Sample[]} */
let samples = []

/** @type {HTMLInputElement} */
let thresholdElement = document.querySelector("#threshold")

/** @type {File} */
let file = null
let initialThreshold = 1.22
let folderName = ""

thresholdElement.addEventListener("change", () => {
	initialThreshold = Number(thresholdElement.value)
	thresholdElement.parentElement.querySelector("span").textContent =
		"[" + initialThreshold + "]"
	split(file, initialThreshold)
})

function blob() {
	let files = []

	for (let [index, sample] of samples.entries()) {
		files.push({
			name:
				folderName +
				"/" +
				index.toString().padStart(3, "0") +
				" " +
				folderName +
				".wav",
			input: sample.blob()
		})
	}

	return downloadZip(files).blob()
}

document.querySelector("#download").addEventListener("click", async () => {
	let link = document.createElement("a")
	link.href = URL.createObjectURL(await blob())
	link.download = name + ".zip"
	link.click()
	link.remove()
})

/** @type {HTMLInputElement} */
let fileInput = document.querySelector("#file")
fileInput.addEventListener("change", async () => {
	;[file] = fileInput.files
	let context = new AudioContext()
	let arraybuffer = await file.arrayBuffer()
	let audiobuffer = await context.decodeAudioData(arraybuffer)
	console.log(fft(audiobuffer))
	// split(file, initialThreshold)
})

/** @param {AudioBuffer} audiobuffer */
async function fft(audiobuffer) {
	let offlineContext = new OfflineAudioContext({
		numberOfChannels: audiobuffer.numberOfChannels,
		sampleRate: audiobuffer.sampleRate,
		length: audiobuffer.length
	})

	let analyser = new AnalyserNode(offlineContext, {
		fftSize: 2048
	})

	let source = new AudioBufferSourceNode(offlineContext, {
		buffer: audiobuffer
	})
	source.connect(analyser)
	analyser.connect(offlineContext.destination)
	console.log(
		audiobuffer.length * audiobuffer.sampleRate * audiobuffer.numberOfChannels
	)

	let freqs = new Float32Array({
		length:
			audiobuffer.length *
			audiobuffer.sampleRate *
			audiobuffer.numberOfChannels
	})

	let times = new Float32Array({
		length:
			audiobuffer.length *
			audiobuffer.sampleRate *
			audiobuffer.numberOfChannels
	})

	{
		let offset = 0
		let fftBuff = new Float32Array({length: analyser.fftSize})
		offlineContext.addEventListener("statechange", event => {
			if (offlineContext.state == "suspended") {
				analyser.getFloatFrequencyData(fftBuff)
				freqs.set(fftBuff, offset)
				analyser.getFloatTimeDomainData(fftBuff)
				times.set(fftBuff, offset)
				offset += analyser.fftSize
			}
			offlineContext.resume()
			offlineContext.suspend(event.playbackTime + 0.1)
		})
	}

	offlineContext.suspend(0.1)
	source.start()
	return new Promise(yay =>
		offlineContext.startRendering().then(() => yay([freqs, times]))
	)
}

// todo drag and drop
// document.querySelector("#browse").addEventListener("click", async () => {
// 	/** @type {FileSystemFileHandle[]} */
// 	let [handle] = await showOpenFilePicker({multiple: false})
// 	file = await handle.getFile()
// 	split(file, initialThreshold)
// })

function removeExtension(filename = "") {
	return filename.replace(/(.*)\.[^.]+$/, (_, c) => c)
}

function removeNumericPrefix(filename = "") {
	return filename.replace(/^\d\d\d (.*)/, (_, c) => c)
}

/**
 * @param {File} file
 * @param {number} initialThreshold
 */
async function split(file, initialThreshold) {
	if (!file) {
		console.info("no file")
		return
	}
	folderName = removeNumericPrefix(removeExtension(file.name))
	samples = []
	let threshold = initialThreshold
	let arraybuffer = await file.arrayBuffer()
	let audiobuffer = await context.decodeAudioData(arraybuffer)
	/** @type {Float32Array} */
	let mono = Sample.prototype.mono.call({
		audiobuffer
	})
	{
		let start = -1
		let lastWindow = 0
		let windowSize = Math.round(audiobuffer.sampleRate / 128)
		console.log(windowSize)
		let changeThreshold = 1.2
		let volumeThreshold = 0.5
		let places = []

		for (let index = 0; index < mono.length; index += 1) {
			let window =
				mono
					.slice(index, index + windowSize)
					.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) / windowSize

			if (window > lastWindow * changeThreshold) {
				if (start != -1) {
					// let aub = sliceAudioBuffer(audiobuffer, start, index)
					// aubs.push(aub)
					places.push(Math.round(index / 4))
					console.log(
						`detected a sample from ${start} to ${index} because ${window} is louder than ${lastWindow}.`
					)
				}
				start = index
				index += windowSize
			}
			lastWindow = window
		}
		console.log(places)
		while (places.length) {
			let start = places.shift()
			let end = places[0]
			let buffer = sliceAudioBuffer(audiobuffer, start, end)
			samples = samples.concat(new Sample(buffer, context))
		}
		// aubs.push(sliceAudioBuffer(audiobuffer, start))
		// samples = places.map(aub => new Sample(aub, 0, 0, context))
	}

	update()
}

/**
 * @param {AudioBuffer} inputBuffer
 * */
function sliceAudioBuffer(inputBuffer, start = 0, end = inputBuffer.length) {
	let outputBuffer = new AudioBuffer({
		length: end - start,
		sampleRate: inputBuffer.sampleRate,
		numberOfChannels: inputBuffer.numberOfChannels
	})
	for (let cidx = 0; cidx < inputBuffer.numberOfChannels; cidx++) {
		let data = inputBuffer.getChannelData(cidx)
		outputBuffer.copyToChannel(data, cidx, start)
	}
	return outputBuffer
}

let samplesElement = document.querySelector("#samples")

function update() {
	while (samples.length < samplesElement.children.length) {
		samplesElement.lastElementChild.remove()
	}
	while (samples.length > samplesElement.children.length) {
		/** @type {HTMLTemplateElement} */
		let sampleTemplate = document.querySelector("template#transient-sample")
		let sampleElement = sampleTemplate.content.cloneNode(true)
		samplesElement.append(sampleElement)
	}

	for (let [index, sample] of samples.entries()) {
		let el = /** @type {TransientSample} */ (
			samplesElement.children[samplesElement.children.length - 1 - index]
		)

		el.sample = sample
	}
}
