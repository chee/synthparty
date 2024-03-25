import Memory from "./memory.js"
/** @type {SharedArrayBuffer} */
let sharedarraybuffer = new SharedArrayBuffer(Memory.size)
let audioContext = new AudioContext()
let analyzer = new AnalyserNode(audioContext, {
	smoothingTimeConstant: 1,
	fftSize: 128
})
let analysis = new Uint8Array(analyzer.frequencyBinCount)
/** @type Memory */
let memory = new Memory(sharedarraybuffer)
memory.sampleRate = audioContext.sampleRate
let input = /** @type HTMLInputElement */ (document.querySelector("input"))
let started = false

let iphoneSilenceElement = /** @type {HTMLAudioElement} */ (
	document.querySelector("audio")
)

if (location.search.length > 1) {
	input.value = decodeURIComponent(location.search.slice(1))
}

export async function start() {
	await play()
	if (started) {
		return
	}
	started = true
	let codenode = new AudioWorkletNode(audioContext, "user-code", {
		processorOptions: {
			sab: sharedarraybuffer
		},
		numberOfInputs: 0,
		numberOfOutputs: 1,
		channelCount: 2,
		outputChannelCount: [2],
		channelInterpretation: "speakers"
	})
	memory.code = input.value
	codenode.connect(analyzer)
	analyzer.connect(audioContext.destination)
}

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		audioContext.suspend()
		iphoneSilenceElement.load()
		iphoneSilenceElement.remove()
		started = false
	} else {
		play()
	}
})

export async function play() {
	await audioContext.resume()
	document.body.append(iphoneSilenceElement)
	iphoneSilenceElement.play()
}

audioContext.onstatechange = function () {
	if (
		// @ts-ignore-line listen, this is a thing on ios, typescript. reality
		// matters
		audioContext.state == "interrupted"
	) {
		audioContext.resume()
	}
}

await audioContext.audioWorklet.addModule("/s/audioworklet.js")
document.addEventListener("click", start, {once: true})
document.addEventListener("keydown", start, {once: true})
document.addEventListener("keypress", start, {once: true})

input?.addEventListener("input", () => {
	memory.code = input.value

	history.pushState(
		null,
		"",
		`?${encodeURIComponent(input.value.replace(/\s+/g, ""))}`
	)
})

let canvas = /** @type {HTMLCanvasElement} */ (
	document.getElementById("screen")
)
let canvasContext = /** @type {CanvasRenderingContext2D} */ (
	canvas.getContext("2d")
)

function getStyle(/** @type string */ prop, el = document.documentElement) {
	return getComputedStyle(el).getPropertyValue("--" + prop)
}

canvas.height = 800
canvas.width = 800

function draw() {
	requestAnimationFrame(draw)
	analyzer.getByteTimeDomainData(analysis)
	canvasContext.fillStyle = getStyle("screen-fill")
	canvasContext.fillRect(0, 0, canvas.width, canvas.height)
	let width = (canvas.width / analyzer.frequencyBinCount) * 2
	let hm = canvas.height / analyzer.fftSize
	canvasContext.fillStyle = getStyle("screen-line")
	{
		let x = 0
		for (let i = 0; i < analyzer.frequencyBinCount; i++) {
			canvasContext.fillRect(
				x,
				canvas.height - (analysis[i] * hm) / 2,
				width,
				analysis[i] * hm
			)

			x += width + 1
		}
	}

	canvasContext.lineWidth = 4
	canvasContext.strokeStyle = "#ffffff"
	canvasContext.beginPath()

	const sliceWidth = (canvas.width * 1.0) / analyzer.frequencyBinCount
	let x = 0

	for (let i = 0; i < analyzer.frequencyBinCount; i++) {
		const v = analysis[i] / 128.0
		const y = (v * canvas.height) / 2

		if (i === 0) {
			canvasContext.moveTo(x, y)
		} else {
			canvasContext.lineTo(x, y)
		}

		x += sliceWidth
	}

	canvasContext.lineTo(canvas.width, canvas.height / 2)
	canvasContext.stroke()
}

draw()
