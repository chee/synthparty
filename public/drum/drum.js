import Kit from "./kit.js"
import Sound from "./sound.js"

let kit = new Kit()
window.kit = kit

let nameInput = document.querySelector("#name")
nameInput.addEventListener("input", () => {
	kit.name = nameInput.value
})
let addButton = document.querySelector("#add")
let rows = document.querySelector("#rows")
let soundTemplate = document.querySelector("template")

let context = new AudioContext()
let iphoneSilenceElement = document.querySelector("audio")

addButton.addEventListener("click", async () => {
	await context.resume()
	iphoneSilenceElement.play()
	rows.prepend(soundTemplate.content.cloneNode(true))
	let soundElement = rows.querySelector("deluge-sound")

	/** @type {HTMLInputElement} */
	let fileInput = soundElement.shadowRoot.querySelector("#file")

	fileInput.addEventListener("change", async () => {
		let [file] = Array.from(fileInput.files)
		let audiobuffer = await context.decodeAudioData(await file.arrayBuffer())
		let sound = new Sound(
			file.name.replace(/(.*)\.[^.]+$/, (_, c) => c),
			audiobuffer
		)
		kit.sounds.push(sound)
		/** @type {HTMLInputElement} */
		let nameInput = soundElement.shadowRoot.querySelector("#name")
		nameInput.value = sound.name.replace(/\.{wav,mp3,m4a,ogg}$/, "")
		nameInput.addEventListener("input", () => {
			sound.name = nameInput.value
		})
		let audition = soundElement.shadowRoot.querySelector("button")
		audition.addEventListener("click", () => {
			let bs = new AudioBufferSourceNode(context, {
				buffer: audiobuffer
			})
			bs.connect(context.destination)
			bs.start()
		})
	})
})

let download = document.querySelector("#download")
download.addEventListener("click", () => {
	kit.download()
})
