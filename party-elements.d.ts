import * as PartyElements from "./public/elements/party-elements"

global {
	interface HTMLCanvasElement extends HTMLElement {
		getContext(
			contextId: "2d",
			options?: CanvasRenderingContext2DSettings
		): CanvasRenderingContext2D
	}
}
