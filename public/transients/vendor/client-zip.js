// @ts-nocheck
"stream" in Blob.prototype ||
	Object.defineProperty(Blob.prototype, "stream", {
		value() {
			return new Response(this).body
		}
	}),
	"setBigUint64" in DataView.prototype ||
		Object.defineProperty(DataView.prototype, "setBigUint64", {
			value(e, n, t) {
				const i = Number(0xffffffffn & n),
					r = Number(n >> 32n)
				this.setUint32(e + (t ? 0 : 4), i, t),
					this.setUint32(e + (t ? 4 : 0), r, t)
			}
		})
var e = e => new DataView(new ArrayBuffer(e)),
	n = e => new Uint8Array(e.buffer || e),
	t = e => new TextEncoder().encode(String(e)),
	i = e => Math.min(4294967295, Number(e)),
	r = e => Math.min(65535, Number(e))
function f(e, i) {
	if (
		(void 0 === i || i instanceof Date || (i = new Date(i)), e instanceof File)
	)
		return {isFile: 1, t: i || new Date(e.lastModified), i: e.stream()}
	if (e instanceof Response)
		return {
			isFile: 1,
			t: i || new Date(e.headers.get("Last-Modified") || Date.now()),
			i: e.body
		}
	if (void 0 === i) i = new Date()
	else if (isNaN(i)) throw new Error("Invalid modification date.")
	if (void 0 === e) return {isFile: 0, t: i}
	if ("string" == typeof e) return {isFile: 1, t: i, i: t(e)}
	if (e instanceof Blob) return {isFile: 1, t: i, i: e.stream()}
	if (e instanceof Uint8Array || e instanceof ReadableStream)
		return {isFile: 1, t: i, i: e}
	if (e instanceof ArrayBuffer || ArrayBuffer.isView(e))
		return {isFile: 1, t: i, i: n(e)}
	if (Symbol.asyncIterator in e)
		return {isFile: 1, t: i, i: o(e[Symbol.asyncIterator]())}
	throw new TypeError("Unsupported input format.")
}
function o(e, n = e) {
	return new ReadableStream({
		async pull(n) {
			let t = 0
			for (; n.desiredSize > t; ) {
				const i = await e.next()
				if (!i.value) {
					n.close()
					break
				}
				{
					const e = a(i.value)
					n.enqueue(e), (t += e.byteLength)
				}
			}
		},
		cancel(e) {
			n.throw?.(e)
		}
	})
}
function a(e) {
	return "string" == typeof e ? t(e) : e instanceof Uint8Array ? e : n(e)
}
function s(e, i, r) {
	let [f, o] = (function (e) {
		return e
			? e instanceof Uint8Array
				? [e, 1]
				: ArrayBuffer.isView(e) || e instanceof ArrayBuffer
					? [n(e), 1]
					: [t(e), 0]
			: [void 0, 0]
	})(i)
	if (e instanceof File) return {o: d(f || t(e.name)), u: BigInt(e.size), l: o}
	if (e instanceof Response) {
		const n = e.headers.get("content-disposition"),
			i = n && n.match(/;\s*filename\*?=["']?(.*?)["']?$/i),
			a =
				(i && i[1]) ||
				(e.url && new URL(e.url).pathname.split("/").findLast(Boolean)),
			s = a && decodeURIComponent(a),
			u = r || +e.headers.get("content-length")
		return {o: d(f || t(s)), u: BigInt(u), l: o}
	}
	return (
		(f = d(f, void 0 !== e || void 0 !== r)),
		"string" == typeof e
			? {o: f, u: BigInt(t(e).length), l: o}
			: e instanceof Blob
				? {o: f, u: BigInt(e.size), l: o}
				: e instanceof ArrayBuffer || ArrayBuffer.isView(e)
					? {o: f, u: BigInt(e.byteLength), l: o}
					: {o: f, u: u(e, r), l: o}
	)
}
function u(e, n) {
	return n > -1 ? BigInt(n) : e ? void 0 : 0n
}
function d(e, n = 1) {
	if (!e || e.every(c => 47 === c))
		throw new Error("The file must have a name.")
	if (n) for (; 47 === e[e.length - 1]; ) e = e.subarray(0, -1)
	else 47 !== e[e.length - 1] && (e = new Uint8Array([...e, 47]))
	return e
}
var l = new Uint32Array(256)
for (let e = 0; e < 256; ++e) {
	let n = e
	for (let e = 0; e < 8; ++e) n = (n >>> 1) ^ (1 & n && 3988292384)
	l[e] = n
}
function y(e, n = 0) {
	n ^= -1
	for (var t = 0, i = e.length; t < i; t++) n = (n >>> 8) ^ l[(255 & n) ^ e[t]]
	return (-1 ^ n) >>> 0
}
function B(e, n, t = 0) {
	const i =
			(e.getSeconds() >> 1) | (e.getMinutes() << 5) | (e.getHours() << 11),
		r =
			e.getDate() | ((e.getMonth() + 1) << 5) | ((e.getFullYear() - 1980) << 9)
	n.setUint16(t, i, 1), n.setUint16(t + 2, r, 1)
}
function w({o: e, l: n}, t) {
	return (
		8 *
		(!n ||
			(t ??
				(function (e) {
					try {
						b.decode(e)
					} catch {
						return 0
					}
					return 1
				})(e)))
	)
}
var b = new TextDecoder("utf8", {fatal: 1})
function p(t, i = 0) {
	const r = e(30)
	return (
		r.setUint32(0, 1347093252),
		r.setUint32(4, 754976768 | i),
		B(t.t, r, 10),
		r.setUint16(26, t.o.length, 1),
		n(r)
	)
}
async function* g(e) {
	let {i: n} = e
	if (("then" in n && (n = await n), n instanceof Uint8Array))
		yield n, (e.m = y(n, 0)), (e.u = BigInt(n.length))
	else {
		e.u = 0n
		const t = n.getReader()
		for (;;) {
			const {value: n, done: i} = await t.read()
			if (i) break
			;(e.m = y(n, e.m)), (e.u += BigInt(n.length)), yield n
		}
	}
}
function I(t, r) {
	const f = e(16 + (r ? 8 : 0))
	return (
		f.setUint32(0, 1347094280),
		f.setUint32(4, t.isFile ? t.m : 0, 1),
		r
			? (f.setBigUint64(8, t.u, 1), f.setBigUint64(16, t.u, 1))
			: (f.setUint32(8, i(t.u), 1), f.setUint32(12, i(t.u), 1)),
		n(f)
	)
}
function v(t, r, f = 0, o = 0) {
	const a = e(46)
	return (
		a.setUint32(0, 1347092738),
		a.setUint32(4, 755182848),
		a.setUint16(8, 2048 | f),
		B(t.t, a, 12),
		a.setUint32(16, t.isFile ? t.m : 0, 1),
		a.setUint32(20, i(t.u), 1),
		a.setUint32(24, i(t.u), 1),
		a.setUint16(28, t.o.length, 1),
		a.setUint16(30, o, 1),
		a.setUint16(40, t.isFile ? 33204 : 16893, 1),
		a.setUint32(42, i(r), 1),
		n(a)
	)
}
function h(t, i, r) {
	const f = e(r)
	return (
		f.setUint16(0, 1, 1),
		f.setUint16(2, r - 4, 1),
		16 & r && (f.setBigUint64(4, t.u, 1), f.setBigUint64(12, t.u, 1)),
		f.setBigUint64(r - 8, i, 1),
		n(f)
	)
}
function D(e) {
	return e instanceof File || e instanceof Response
		? [[e], [e]]
		: [
				[e.input, e.name, e.size],
				[e.input, e.lastModified]
			]
}
var S = e =>
	(function (e) {
		let n = BigInt(22),
			t = 0n,
			i = 0
		for (const r of e) {
			if (!r.o) throw new Error("Every file must have a non-empty name.")
			if (void 0 === r.u)
				throw new Error(
					`Missing size for file "${new TextDecoder().decode(r.o)}".`
				)
			const e = r.u >= 0xffffffffn,
				f = t >= 0xffffffffn
			;(t += BigInt(46 + r.o.length + (e && 8)) + r.u),
				(n += BigInt(r.o.length + 46 + ((12 * f) | (28 * e)))),
				i || (i = e)
		}
		return (i || t >= 0xffffffffn) && (n += BigInt(76)), n + t
	})(
		(function* (e) {
			for (const n of e) yield s(...D(n)[0])
		})(e)
	)
function A(e, n = {}) {
	const t = {
		"Content-Type": "application/zip",
		"Content-Disposition": "attachment"
	}
	return (
		("bigint" == typeof n.length || Number.isInteger(n.length)) &&
			n.length > 0 &&
			(t["Content-Length"] = String(n.length)),
		n.metadata && (t["Content-Length"] = String(S(n.metadata))),
		new Response(N(e, n), {headers: t})
	)
}
function N(t, a = {}) {
	const u = (function (e) {
		const n =
			e[Symbol.iterator in e ? Symbol.iterator : Symbol.asyncIterator]()
		return {
			async next() {
				const e = await n.next()
				if (e.done) return e
				const [t, i] = D(e.value)
				return {done: 0, value: Object.assign(f(...i), s(...t))}
			},
			throw: n.throw?.bind(n),
			[Symbol.asyncIterator]() {
				return this
			}
		}
	})(t)
	return o(
		(async function* (t, f) {
			const o = []
			let a = 0n,
				s = 0n,
				u = 0
			for await (const e of t) {
				const n = w(e, f.buffersAreUTF8)
				yield p(e, n), yield e.o, e.isFile && (yield* g(e))
				const t = e.u >= 0xffffffffn,
					i = (12 * (a >= 0xffffffffn)) | (28 * t)
				yield I(e, t),
					o.push(v(e, a, n, i)),
					o.push(e.o),
					i && o.push(h(e, a, i)),
					t && (a += 8n),
					s++,
					(a += BigInt(46 + e.o.length) + e.u),
					u || (u = t)
			}
			let d = 0n
			for (const e of o) yield e, (d += BigInt(e.length))
			if (u || a >= 0xffffffffn) {
				const t = e(76)
				t.setUint32(0, 1347094022),
					t.setBigUint64(4, BigInt(44), 1),
					t.setUint32(12, 755182848),
					t.setBigUint64(24, s, 1),
					t.setBigUint64(32, s, 1),
					t.setBigUint64(40, d, 1),
					t.setBigUint64(48, a, 1),
					t.setUint32(56, 1347094023),
					t.setBigUint64(64, a + d, 1),
					t.setUint32(72, 1, 1),
					yield n(t)
			}
			const l = e(22)
			l.setUint32(0, 1347093766),
				l.setUint16(8, r(s), 1),
				l.setUint16(10, r(s), 1),
				l.setUint32(12, i(d), 1),
				l.setUint32(16, i(a), 1),
				yield n(l)
		})(u, a),
		u
	)
}
export {A as downloadZip, N as makeZip, S as predictLength}
