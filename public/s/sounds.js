import Memory from "./memory"
/** @type Memory */
let memory
let iphoneSilenceElement = /** @type {HTMLAudioElement} */ (
	document.querySelector("audio")
)

let context = new AudioContext()
/** @type {SharedArrayBuffer} */
let sharedarraybuffer

export async function start() {
	await play()
	let analyzer = context.createAnalyser()
	analyzer.fftSize = 2048
	// todo write analysis to memory periodically
	let analysis = new Float32Array(analyzer.fftSize)
	let codenode = new AudioWorkletNode(context, "user-code", {
		processorOptions: {
			sab: sharedarraybuffer
		},
		numberOfInputs: 0,
		numberOfOutputs: 1,
		channelCount: 1,
		outputChannelCount: [1],
		channelInterpretation: "speakers"
	})
	codenode.connect(analyzer)
	analyzer.connect(context.destination)
}

/**
 * @param {SharedArrayBuffer} buffer
 */
export async function init(buffer) {
	sharedarraybuffer = buffer
	let memory = new Memory(buffer)
	memory.sampleRate = context.sampleRate
}

document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		context.suspend()
		iphoneSilenceElement.load()
		iphoneSilenceElement.remove()
	} else {
		play()
	}
})

export async function play() {
	context.onstatechange = function () {
		if (
			// @ts-ignore-line listen, this is a thing on ios, typescript. reality
			// matters
			context.state == "interrupted"
		) {
			// alreadyFancy = false
			context.resume().then(() => {
				// alreadyFancy = true
			})
		}
	}
	await context.resume()
	document.body.append(iphoneSilenceElement)
	iphoneSilenceElement.play()
}

await context.audioWorklet.addModule("/s/audioworklet.js")
