import {downloadZip} from "/vendor/client-zip.js"
import TransientSample from "./elements/sample-element.js"
import Sample from "./sample.js"
let context = new AudioContext()
let name = "transients"
import {init} from "./elements/init.js"
import * as dsp from "/libraries/dsp/dsp.js"
init()

/** @type {Sample[]} */
let samples = []

/** @type {HTMLInputElement?} */
let thresholdElement = document.querySelector("#threshold")
let techniqueElement = document.querySelector("#technique")
let technique = "spectral-std"

/** @type {File?} */
let file = null
let initialThreshold = 0.5
thresholdElement.value = "" + initialThreshold
techniqueElement.value = technique

let folderName = ""

thresholdElement?.addEventListener("change", () => {
	initialThreshold = Number(thresholdElement.value)
	thresholdElement.parentElement.querySelector("span").textContent =
		"[" + initialThreshold + "]"
	split(file, initialThreshold)
})

techniqueElement?.addEventListener("change", () => {
	technique = techniqueElement.value
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
	split(file, initialThreshold)
})

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
 * @param {File?} file
 * @param {number} initialThreshold
 */
async function split(file, initialThreshold) {
	if (!file) {
		console.info("no file")
		return
	}
	folderName = removeNumericPrefix(removeExtension(file.name))
	samples = []

	let arraybuffer = await file.arrayBuffer()
	let audiobuffer = await context.decodeAudioData(arraybuffer)

	/** @type {Float32Array} */
	Sample.prototype.normalize.call({audiobuffer})
	let mono = Sample.prototype.mono.call({audiobuffer})

	let hop = 256
	/** @type {number[]} */
	let onsets = []
	if (technique.startsWith("spectral")) {
		let flux = calculateSpectralFlux(mono, 2048, hop, audiobuffer.sampleRate)
		let mean = flux.reduce((acc, val) => acc + val, 0) / flux.length
		let std = Math.sqrt(
			flux
				.map(val => Math.pow(val - mean, 2))
				.reduce((acc, val) => acc + val, 0) / flux.length
		)
		let thresh = mean + initialThreshold * std
		let frames = findOnsets(
			flux,
			technique == "spectral-std" ? initialThreshold : thresh
		)
		onsets = [0].concat(frames.map(i => i * hop))
	} else if (technique == "energy") {
		onsets = calculateEnergyOnsets(mono, 2048, hop, initialThreshold)
	} else if (technique == "misc") {
		let start = 0
		let lastWindow = 0
		let windowSize = Math.round(audiobuffer.sampleRate / 128)
		for (let index = 0; index < mono.length; index += 1) {
			let window =
				mono
					.slice(index, index + windowSize)
					.map(dsp.window.bartlett)
					.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) / windowSize

			if (window > lastWindow * initialThreshold) {
				onsets.push(Math.round(start))
				start = index
				index += windowSize
			}
			lastWindow = window
		}
	}

	for (let i = 0; i < onsets.length; i++) {
		let start = Math.round(onsets[i])
		let end = onsets[i + 1] ? Math.round(onsets[i + 1]) : mono.length
		samples.push(
			new Sample(sliceAudioBuffer(audiobuffer, start, end), context)
		)
	}

	samples = samples.filter(n => n.audiobuffer.duration > 0.01)

	update()
}

function calculateEnergyOnsets(signal, windowSize, increment, multiplier) {
	let numFrames = Math.floor((signal.length - windowSize) / increment) + 1
	let energies = new Float32Array(numFrames)
	let avg = 0
	let onsets = []

	for (
		let i = 0, frameStart = 0;
		frameStart + windowSize <= signal.length;
		i++, frameStart += increment
	) {
		let energy = 0
		for (let j = 0; j < windowSize; j++) {
			energy += signal[frameStart + j] ** 2
		}
		energies[i] = energy

		avg = (avg * i + energy) / (i + 1)

		if (energy > avg * multiplier && i > 0) {
			onsets.push(frameStart)
		}
	}

	return onsets
}

/**
 * @param {Float32Array} signal
 * @param {number} fftSize
 * @param {number} hopSize
 * @param {number} sampleRate
 */
function calculateSpectralFlux(signal, fftSize, hopSize, sampleRate) {
	let fft = new dsp.FFT(fftSize, sampleRate)
	let previousSpectrum = new Float32Array(fftSize / 2)
	let spectralFlux = []

	for (let i = 0; i < signal.length - fftSize; i += hopSize) {
		let frame = signal.slice(i, i + fftSize)
		frame = frame.map(dsp.window.hamming)
		fft.forward(frame)
		let spectrum = fft.spectrum
		let flux = 0
		for (let j = 0; j < spectrum.length; j++) {
			let diff = spectrum[j] - previousSpectrum[j]
			flux += diff > 0 ? diff : 0
		}
		spectralFlux.push(flux)

		previousSpectrum = spectrum.slice()
	}

	return spectralFlux
}

/**
 * @param {number[]} flux
 * @param {number} threshold
 */
function findOnsets(flux, threshold) {
	let onsets = []
	for (let i = 1; i < flux.length; i++) {
		if (flux[i] > threshold && flux[i] > flux[i - 1]) {
			onsets.push(i)
		}
	}
	return onsets
}

/**
 * @param {AudioBuffer} inputBuffer
 * */
function sliceAudioBuffer(inputBuffer, start = 0, end = 0) {
	let outputBuffer = new AudioBuffer({
		length: end - start,
		sampleRate: inputBuffer.sampleRate,
		numberOfChannels: inputBuffer.numberOfChannels
	})

	for (let cidx = 0; cidx < inputBuffer.numberOfChannels; cidx++) {
		let input = inputBuffer.getChannelData(cidx)
		let segment = input.subarray(start, end)
		outputBuffer.copyToChannel(segment, cidx)
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
