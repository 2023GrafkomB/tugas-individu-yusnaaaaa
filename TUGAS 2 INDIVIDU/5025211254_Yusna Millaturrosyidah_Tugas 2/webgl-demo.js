import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let cubeRotation = 0.0;
let deltaTime = 0;
let isAnimating = true; // Variabel untuk mengontrol animasi

main();

//
// Mulai di sini
//
function main() {
  const canvas = document.querySelector("#glcanvas");
  // Inisialisasi konteks WebGL
  const gl = canvas.getContext("webgl");

  // Lanjutkan hanya jika WebGL tersedia dan berfungsi
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  // Atur warna latar belakang canvas menjadi pink
  gl.clearColor(1.0, 0.0, 1.0, 1.0);

  // Bersihkan buffer warna dengan warna yang telah diatur
  gl.clear(gl.COLOR_BUFFER_BIT);


  // Program shader vertex

  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

  // Program shader fragment

  const fsSource = `
  varying highp vec2 vTextureCoord;

  uniform sampler2D uSampler;

  void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
`;

  // Inisialisasi program shader; di sinilah semua pencahayaan
  // untuk vertex dan sebagainya dibentuk.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Kumpulkan semua info yang diperlukan untuk menggunakan program shader.
  // Cari atribut-atribut yang digunakan program shader kita
  // untuk aVertexPosition, aVertexColor dan juga
  // cari lokasi uniform.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };

  // Panggil rutinitas yang membangun semua objek
  // yang akan kita gambar.
  const buffers = initBuffers(gl);

  // Muat tekstur
  const texture = loadTexture(gl, "images/6.jpg");
  // Balik piksel gambar ke urutan dari bawah ke atas yang diharapkan oleh WebGL.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let then = 0;

  // Gambar adegan secara berulang-ulang
  function render(now) {
    if (isAnimating) {
      now *= 0.001; // konversi ke detik
      deltaTime = now - then;
      then = now;

      drawScene(gl, programInfo, buffers, texture, cubeRotation);
      cubeRotation += deltaTime;
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // Mendengarkan tombol spasi dan enter untuk mengontrol animasi
  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      // Tombol spasi
      isAnimating = !isAnimating; // Mengubah status animasi
    // } else if (event.key === "Enter") {
    //   // Tombol enter
    //   isAnimating = !isAnimating; // Mengubah status animasi
    }
  });
}

//
// Inisialisasi program shader, sehingga WebGL tahu cara menggambar data kita
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Buat program shader

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Jika pembuatan program shader gagal, beri tahu

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// Membuat shader sesuai dengan tipe yang diberikan, mengunggah sumbernya, dan
// mengkompilasinya.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Kirim sumber ke objek shader

  gl.shaderSource(shader, source);

  // Kompilasi program shader

  gl.compileShader(shader);

  // Periksa apakah berhasil dikompilasi

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Inisialisasi tekstur dan muat gambar.
// Ketika gambar selesai dimuat, salin ke tekstur.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Karena gambar harus diunduh melalui internet
  // mereka mungkin memerlukan waktu sebelum siap.
  // Sementara itu, letakkan satu piksel dalam tekstur sehingga kita dapat
  // menggunakannya segera. Ketika gambar selesai diunduh,
  // kami akan memperbarui tekstur dengan konten gambar.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // biru yang tidak transparan
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 memiliki persyaratan yang berbeda untuk gambar berkekuatan 2
    // vs gambar yang bukan berkekuatan 2, jadi periksa apakah gambar tersebut
    // berkekuatan 2 dalam kedua dimensinya.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Ya, ini adalah berkekuatan 2. Hasilkan mipmap.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // Tidak, ini bukan berkekuatan 2. Matikan mipmap dan atur
      // pembungkusan ke pinggir
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}
