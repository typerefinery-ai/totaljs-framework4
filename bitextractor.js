// Bit Extractor
// The MIT License
// Copyright 2021-2022 (c) Peter Štolc <stolcp@posteo.de>

var ALLOWED = {};

(function() {
	const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
	for (var i = 0; i < alphabet.length; i++)
		ALLOWED[alphabet[i]] = i + 1;
})();

class BitExtractor {

	constructor(data, from, to) {

		if (from < 2 || from > 36 || to < 2 || to > 36) {
			this.invalid = true;
			return;
		}

		this.data = this.verify(data, from);

		if (this.invalid)
			return;

		var bin = this.toBin(data, from);

		this.offset = 0;
		this.to = to;

		this._bytes = bin.padStart(Math.ceil(bin.length / 8) * 8, '0');
		this._bits = '';

		var length = Math.ceil(bin.length / 8);
		for (var x = 0; x < length; x++)
			this._bits += this._bytes.substring(x * 8, (x * 8) + 8).split('').reverse().join('');
	};

	get buffer() {
		return Buffer.from(this.data, 'hex');
	};

	verify(data, base) {
		data = data.toLowerCase();
		for (let c of data)  {
			if (!(ALLOWED[c] != null && ALLOWED[c] <= base)) {
				this.invalid = true;
				return '';
				// throw new RangeError(`${c} is not a valid digit in base ${base}`);
			}
		}
		return data;
	};

	toBin(value, radix) {

		var val = 0;

		if (radix === 2)
			return value;

		if (value.length >= Number.MAX_SAFE_INTEGER.toString(radix).length) {
			if (radix === 16) {
				if (value.substring(0, 2) !== '0x')
					value = '0x' + value;
					val = BigInt(value);
				} else if (radix == 8) {
					if (value.substring(0, 2) !== '0o')
						value = '0o' + value;
					val = BigInt(value);
				} else {
					var chunk = 10;
					var factor = BigInt(radix ** chunk);
					var i = value.length % chunk || chunk;
					parts = [value.slice(0, i)];
					while (i < value.length)
						parts.push(value.slice(i, i += chunk));
					val = parts.reduce((r, v) => r * factor + BigInt(parseInt(v, radix)), 0n);
				}
			} else
				val = parseInt(value, radix);

		return val.toString(2);
	};

	parse(start, length = 1, type = 'bits') {
		return type === 'bits' ? this.parseBits(start, length) : this.parseBytes(start, length);
	};

	shift(start, length = 1, type = 'bits') {
		return type === 'bits' ? this.shiftBits(start, length) : this.shiftBytes(start, length);
	};

	parseBits(start, length = 1) {

		if (this.invalid)
			return 0;

		var bits = this._bits.substring(start, start + length).split('').reverse().join('');
		return this.to != 10 ? parseInt(bits, 2).toString(this.to) : parseInt(bits, 2);
	};

	parseBytes(start, length = 1) {

		if (this.invalid)
			return 0;

		start *= 8;
		length *= 8;

		if (start >= this._bytes.length)
			return 0;

		return this.to != 10 ? parseInt(this._bytes.substring(start, start + length), 2).toString(this.to) : parseInt(this._bytes.substring(start, start + length), 2);
	};

	shiftBits(bits = 1) {

		if (this.invalid || this.offset >= this._bits.length)
			return 0;

		var ret = this.parseBits(this.offset, bits);
		this.offset += bits;

		return ret;
	};

}

exports.make = function(data, from = 16, to = 10) {
	return new BitExtractor(data, from, to);
};