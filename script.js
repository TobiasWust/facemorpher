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
  let lefteye;
  let eyedistance;
  imageUpload.addEventListener('change', async () => {
    [...imageUpload.files].forEach(async file => {
      const image = await faceapi.bufferToImage(file)
      const canvas = faceapi.createCanvasFromMedia(image)
      const canvas2 = faceapi.createCanvasFromMedia(image)
      
      const displaySize = { width: image.width, height: image.height }
      const detectionWithLandmarks = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      const resizedResults = await faceapi.resizeResults(detectionWithLandmarks, displaySize)
      const align = await resizedResults.landmarks.getRefPointsForAlignment()
      align.pop(); // dont need the mouth

      if (!lefteye) lefteye = align[0];
      if (!eyedistance) eyedistance = align[1].x - align[0].x;
      const alignhelper = {
        dx: lefteye.x - align[0].x * (eyedistance / (align[1].x - align[0].x)),
        dy: lefteye.y - align[0].y * (eyedistance / (align[1].x - align[0].x)),
        zoom: eyedistance / (align[1].x - align[0].x)
      }

      console.log('alignhelper', alignhelper)
      console.log('eyedistance', eyedistance)

      const ctx = canvas.getContext('2d');
      const ctx2 = canvas.getContext('2d');
      // align.forEach(a => {
      //   ctx.beginPath();
      //   ctx.fillStyle = '#FF0000';
      //   ctx.arc(a.x, a.y, 20, 0, 2 * Math.PI);
      //   ctx.fill();
      //   ctx.stroke();
      // });
      // ctx.clearRect(0, 0, canvas.width, canvas.height);  // clear canvas
      // ctx.drawImage(canvas2, lefteye.x - align[0].x, lefteye.y - align[0].y);
      // ctx.drawImage(canvas, alignhelper.dx, alignhelper.dy);
      ctx.setTransform(alignhelper.zoom, 0, 0, alignhelper.zoom, alignhelper.dx, alignhelper.dy);
      ctx.drawImage(canvas, 0, 0);

      // document.querySelector('#gif').append(canvas);
      gif.addFrame(canvas, {delay: 500});
    })
  })
}

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)
