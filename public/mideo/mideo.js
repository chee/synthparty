let canvas = document.querySelector("canvas")
let gl = canvas.getContext("webgl2")

let index = 0
let program = gl.createProgram()

function attachShaders() {
	program = gl.createProgram()
	let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
	let content = document.getElementById("fragment").value

	gl.shaderSource(fragmentShader, content.replace("<%index%>", index))
	gl.compileShader(fragmentShader)
	gl.attachShader(program, fragmentShader)

	let vertexShader = gl.createShader(gl.VERTEX_SHADER)
	gl.shaderSource(vertexShader, document.getElementById("vertex").value)
	gl.compileShader(vertexShader)
	gl.attachShader(program, vertexShader)
	gl.linkProgram(program)
	gl.useProgram(program)
}

attachShaders()

let pos = gl.getAttribLocation(program, "pos")
gl.enableVertexAttribArray(pos)

let a_size = gl.getAttribLocation(program, "a_size")
let u_strength = gl.getUniformLocation(program, "u_strength")
gl.uniform1f(u_strength, 8)
gl.enableVertexAttribArray(a_size)
gl.vertexAttribPointer(a_size, 2, gl.FLOAT_VEC2, false, 0, 0)

let u_matrix = gl.getUniformLocation(program, "u_matrix")
let v_tex_coord = gl.getUniformLocation(program, "v_tex_coord")
let v_color_mix = gl.getUniformLocation(program, "v_color_mix")
let u_texture = gl.getUniformLocation(program, "u_texture")

gl.clearColor(0.0, 0.0, 0.0, 0.0)
gl.clearDepth(1.0)
gl.disable(gl.DEPTH_TEST)

let positionsBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer)
let positions = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

let vertexColors = [0xff00ff88, 0xffffffff]

let cBuffer = gl.createBuffer()

let verticesIndexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer)

let vertexIndices = [0, 1, 2, 0, 2, 3]

gl.bufferData(
	gl.ELEMENT_ARRAY_BUFFER,
	new Uint16Array(vertexIndices),
	gl.STATIC_DRAW
)

let texture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, texture)

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.bindTexture(gl.TEXTURE_2D, null)

let videos = []

function addVideo(src = "") {
	let video = document.createElement("video")
	video.loop = true
	video.volume = 0
	video.src = src
	videos.push(video)
}

function updateTexture() {
	gl.bindTexture(gl.TEXTURE_2D, texture)
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
	if (videos[index]) {
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			videos[index]
		)
	}
	gl.bindTexture(gl.TEXTURE_2D, null)
}

function animate() {
	let video = videos[index]
	if (video && video.readyState >= 3) {
		updateTexture()
		gl.useProgram(program)
		gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer)
		gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, texture)
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
	}

	requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

canvas.addEventListener("click", () => {
	canvas.requestFullscreen()
})

document.querySelectorAll("figure").forEach(shader => {
	shader.addEventListener("keyup", () => {
		attachShaders()
	})
})

let midi = await navigator.requestMIDIAccess({
	software: true,
	sysex: true
})

let inputs = [...midi.inputs]
let [, delugeInput] = inputs.find(([string, device]) =>
	device.name.startsWith("Deluge")
)
let deluge = await delugeInput.open()

let MidiMessage = {
	NoteOff: 0x8,
	NoteOn: 0x9,
	Pressure: 0xa,
	CC: 0xb,
	bend: 0xe
}

deluge.addEventListener("midimessage", event => {
	let data = event.data
	let [msg] = data
	let byte = msg.toString(16)
	let [type, channel] = byte
	if (type == MidiMessage.NoteOn) {
		let note = data[1]
		let velo = data[2]
		if (videos[index]) {
			videos[index].pause()
		}
		index = note
		if (videos[index]) {
			videos[index].currentTime = 0
			attachShaders()
			videos[index].play()
		}
	}
})

navigator.permissions.query({name: "midi", sysex: true}).then(permission => {
	console.log(permission, permission.state)
})

console.log(midi)

export {}

let html = document.documentElement

window.addEventListener("dragenter", async function (event) {
	event.preventDefault()
	let {items} = event.dataTransfer
	for (let item of Array.from(items)) {
		if (item.kind == "file") {
			console.log("hey there")
			if (item.type.startsWith("video/")) {
				html.setAttribute("drop-target", "drop-target")
			} else {
				console.debug(`unsupported type: ${item.kind}, ${event.type}`)
			}
		}
	}
	event.preventDefault()
})
window.addEventListener(
	"dragover" /** @param {DragEvent} event */,
	async function dragover(event) {
		event.preventDefault()

		let {items} = event.dataTransfer
		for (let item of Array.from(items)) {
			// TODO restrict to supported formats by trying to decode a silent audio
			// item of all the formats anyone supports?
			if (item.kind == "file") {
				if (item.type.startsWith("video/")) {
					html.setAttribute("drop-target", "")
				} else {
					console.error(`unsupported type: ${item.kind}, ${event.type}`)
				}
			}
		}
	}
)
window.addEventListener(
	"dragleave" /** @param {DragEvent} event */,
	async function dragleave(event) {
		event.preventDefault()
		html.removeAttribute("drop-target")
	}
)
window.addEventListener(
	"drop" /** @param {DragEvent} event */,
	async function drop(event) {
		html.removeAttribute("drop-target")
		if (event.dataTransfer.items) {
			event.preventDefault()
			for (let item of Array.from(event.dataTransfer.items)) {
				if (item.kind == "file") {
					let file = item.getAsFile()
					let ab = await file.arrayBuffer()
					let blob = new Blob([ab])
					let url = URL.createObjectURL(blob)
					addVideo(url)
				}
			}
		}
	}
)
