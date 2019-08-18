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
  let reflefteye;
  let refeyedistance;
  let refrotation;
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

      if (!reflefteye) reflefteye = align[0];
      const distance = Math.sqrt((align[1].x - align[0].x) ** 2 + (align[1].x - align[0].x) ** 2);
      if (!refeyedistance) refeyedistance = distance;
      const zoom = refeyedistance / (distance);
      const rotation = Math.atan((align[1].y - align[0].y) / align[1].x - align[0].x);
      if (!refrotation) refrotation = rotation;

      const alignhelper = {
        dx: reflefteye.x - align[0].x * zoom,
        dy: reflefteye.y - align[0].y * zoom,
      }

      console.log('alignhelper', alignhelper)
      console.log('eyedistance', refeyedistance)
      console.log('rotation', refrotation, rotation)

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
      ctx.rotate(rotation);
      ctx.setTransform(zoom, 0, 0, zoom, alignhelper.dx, alignhelper.dy);
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
