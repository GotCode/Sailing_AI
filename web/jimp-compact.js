const { Buffer } = require('buffer');

class Jimp {
  constructor() {
    this.bitmap = { data: new Uint8Array(0), width: 1, height: 1 };
  }

  static async read() {
    return new Jimp();
  }

  static async readAsync() {
    return new Jimp();
  }

  static parseBitmap() {
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

  getBufferAsync() {
    return Promise.resolve(Buffer.from(''));
  }

  getBase64Async() {
    return Promise.resolve('');
  }

  clone() {
    return new Jimp();
  }

  resize() {
    return this;
  }

  quality() {
    return this;
  }

  greyscale() {
    return this;
  }

  writeAsync() {
    return Promise.resolve(this);
  }
}

Jimp.MIME_PNG = 'image/png';
Jimp.MIME_JPEG = 'image/jpeg';
Jimp.AUTO = -1;

module.exports = Jimp;
