let featureflags = new URLSearchParams(location.search.slice(1))
for (let [flag, value] of featureflags.entries()) {
	document.documentElement.setAttribute(flag, value)
}
