import Kit from "./kit.js"
import Sound from "./sound.js"

let kit = new Kit()

let main = document.querySelector("main")

let blob = await downloadZip([
	{
		name: "file",
		lastModified: new Date(),
		input: "i am a file"
	}
]).blob()
