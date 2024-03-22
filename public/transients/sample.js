import wav from "/libraries/audio-buffer-to-wav.js"
let iphoneSilenceElement = document.querySelector("audio")

export default class Sample {
	/** @type {AudioBufferSourceNode} */
	#buffersource
	/**
	 * @param {AudioBuffer} audiobuffer
	 * -@param {number} start
	 * -@param {number} end
	 * @param {AudioContext} audioContext
	 */
	constructor(audiobuffer, audioContext) {
		this.audiobuffer = audiobuffer
		this.context = audioContext
		this.normalize()
	}

	normalize() {
		for (
			let channelIdx = 0;
			channelIdx < this.audiobuffer.numberOfChannels;
			channelIdx++
		) {
			let channel = this.audiobuffer.getChannelData(channelIdx)
			let maxSampleVolume = 0
			for (let f32 of channel) {
				maxSampleVolume = Math.max(Math.abs(f32), maxSampleVolume)
			}

			if (maxSampleVolume != 0) {
				this.volume = 50 * maxSampleVolume
				let mult = (1 / maxSampleVolume) * 0.99
				for (
					let sampleIndex = 0;
					sampleIndex < channel.byteLength;
					sampleIndex++
				) {
					channel[sampleIndex] *= mult
				}
			}
		}
	}

	blob() {
		return new Blob([wav(this.audiobuffer)])
	}

	noteOn() {
		this.context.resume()
		iphoneSilenceElement.play()
		this.stop()

		let buffersource = new AudioBufferSourceNode(this.context, {
			buffer: this.audiobuffer
		})

		this.#buffersource = buffersource
		buffersource.connect(this.context.destination)
		buffersource.start()
	}

	noteOff() {
		this.stop()
	}

	stop() {
		if (this.#buffersource) {
			this.#buffersource.stop()
		}
	}

	mono() {
		let aub = this.audiobuffer
		let mono = new Float32Array(aub.length)
		for (let channel = 0; channel < aub.numberOfChannels; channel++) {
			let data = aub.getChannelData(channel)
			for (let i = 0; i < data.length; i++) {
				mono[i] += data[i] / aub.numberOfChannels
			}
		}
		return mono
	}
}
