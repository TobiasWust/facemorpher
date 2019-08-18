/* global GIF faceapi */
const imageUpload = document.getElementById('imageUpload')

const gif = new GIF({
  workers: 2,
  quality: 10
});

const makeGif = () => {
  gif.on('finished', (blob) => {
    const gifElement = document.createElement('img')
    gifElement.src = URL.createObjectURL(blob);
    document.querySelector('#gif').append(gifElement);
  });

gif.render();
}

const start = async () => {
  imageUpload.addEventListener('change', async () => {
    [...imageUpload.files].forEach(async file => {
      const image = await faceapi.bufferToImage(file)
      const canvas = faceapi.createCanvasFromMedia(image)
      
      const displaySize = { width: image.width, height: image.height }
      const detectionWithLandmarks = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      const resizedResults = await faceapi.resizeResults(detectionWithLandmarks, displaySize)
      const align = await resizedResults.landmarks.getRefPointsForAlignment()

      const ctx = canvas.getContext('2d');
      align.pop();
      align.forEach(a => {
        ctx.beginPath();
        ctx.fillStyle = '#FF0000';
        ctx.arc(a.x, a.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
      gif.addFrame(canvas, {delay: 500});
    })
  })
}

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)
