import Kit from "./kit.js"
import adjectives from "./lib/adjectives.js"
import nouns from "./lib/nouns.js"
import rand from "./lib/rand.js"
import * as elements from "./elements/init.js"
elements.init()
import Sound from "./sound.js"

let kit = new Kit(rand(adjectives) + " " + rand(nouns))
let kitElement = document.querySelector("deluge-kit")
kitElement.kit = kit

kitElement.when("audition", index => {
	kit.getSoundFromUiIndex(index).audition()
})

kitElement.when("move-down", index => {
	kit.nudgeSound(kit.getSoundIndexFromUiIndex(index), "down")
	kitElement.kit = kit
})

kitElement.when("move-up", index => {
	kit.nudgeSound(kit.getSoundIndexFromUiIndex(index), "up")
	kitElement.kit = kit
})

kitElement.when("browse", async index => {
	let [sound] = await Sound.browse({
		multiple: false
	})
	kit.getSoundFromUiIndex(index).replace(sound)
	kitElement.kit = kit
})

kitElement.when("add-sound", async () => {
	let sounds = await Sound.browse({multiple: true})
	kit.addSounds(sounds)
	kitElement.kit = kit
})

kitElement.when("set-kit-name", name => {
	kit.name = name
})

kitElement.when("set-sound-name", ({name, index}) => {
	kit.getSoundFromUiIndex(index).name = name
})

kitElement.when("download", event => {
	kit.download({
		sortable: !event.shiftKey
	})
})
