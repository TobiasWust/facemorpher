/* global GIF faceapi */
const imageUpload = document.getElementById('imageUpload')

const gif = new GIF({
  workers: 2,
  quality: 10
});

const makeGif = () => {
gif.on('finished', (blob) => {
  window.open(URL.createObjectURL(blob));
});

gif.render();
}

const start = async () => {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  // const canvas = document.createElement('canvas')
  // document.body.append(canvas);
  let image
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()

    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    const canvas = faceapi.createCanvasFromMedia(image)
    const ctx = canvas.getContext('2d');

    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    const detectionWithLandmarks = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
    const resizedResults = faceapi.resizeResults(detectionWithLandmarks, displaySize)
    const align = resizedResults.landmarks.getRefPointsForAlignment()

// //grab the context from your destination canvas
// var destCtx = destinationCanvas.getContext('2d');

// //call its drawImage() function passing it the source canvas directly
// destCtx.drawImage(sourceCanvas, 0, 0);

    align.pop();
    align.forEach(a => {
      ctx.beginPath();
      ctx.fillStyle = '#FF0000';
      ctx.arc(a.x, a.y, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
    gif.addFrame(canvas, {delay: 200});
    makeGif();
  })
}

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)
