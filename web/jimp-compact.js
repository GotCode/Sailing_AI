const { Buffer } = require('buffer');

class Jimp {
  constructor() {
    this.bitmap = { data: new Uint8Array(0), width: 1, height: 1 };
  }

  static async read(source) {
    // Prevent actual file reading - return mock object
    return new Jimp();
  }

  static async readAsync(source) {
    // Prevent actual file reading - return mock object
    return new Jimp();
  }

  static parseBitmap(data) {
    return {
      data: new Uint8Array(0),
      width: 1,
      height: 1,
      hasAlpha: false,
    };
  }

  static intToRGBA() {
    return { r: 0, g: 0, b: 0, a: 255 };
  }

  getBufferAsync(mime, cb) {
    if (cb) return cb(null, Buffer.from(''));
    return Promise.resolve(Buffer.from(''));
  }

  getBase64Async(mime, cb) {
    if (cb) return cb(null, '');
    return Promise.resolve('');
  }

  clone() {
    return new Jimp();
  }

  resize(w, h) {
    return this;
  }

  quality(q) {
    return this;
  }

  greyscale() {
    return this;
  }

  grayscale() {
    return this;
  }

  writeAsync(path, cb) {
    if (cb) return cb(null, this);
    return Promise.resolve(this);
  }

  write(path, cb) {
    if (cb) return cb(null, this);
    return Promise.resolve(this);
  }

  // Prevent actual image processing
  _parseSignature() {
    return this;
  }

  _parseIHDR() {
    return this;
  }

  process(mime, cb) {
    if (cb) return cb(null, this);
    return Promise.resolve(this);
  }
}

Jimp.MIME_PNG = 'image/png';
Jimp.MIME_JPEG = 'image/jpeg';
Jimp.MIME_BMP = 'image/bmp';
Jimp.MIME_TIFF = 'image/tiff';
Jimp.MIME_GIF = 'image/gif';
Jimp.AUTO = -1;

module.exports = Jimp;
