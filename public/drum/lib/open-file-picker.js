export default async function showOpenFilePicker({
	multiple = false,
	types = []
} = {}) {
	if (window.showOpenFilePicker) {
		return window.showOpenFilePicker({multiple, types})
	}
	return new Promise((yay, boo) => {
		let input = document.createElement("input")
		input.type = "file"
		input.multiple = multiple
		input.accept = types
			.map(type => type.accept)
			.flatMap(inst => Object.keys(inst).flatMap(key => inst[key]))
			.join(",")

		input.addEventListener("change", () => {
			yay(
				Array.from(input.files).map(file => {
					return {
						getFile: async () =>
							new Promise(yay => {
								yay(file)
							})
					}
				})
			)
		})

		input.click()
	})
}
