let globalStylesElement = document.querySelector("#global-styles")
let globalStyles = new CSSStyleSheet()
globalStyles.replaceSync(globalStylesElement.textContent)
export default globalStyles
