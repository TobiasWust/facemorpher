/* global GIF faceapi */
const imageUpload = document.getElementById('imageUpload')
let gif;

const delay = document.querySelector('#delay');
function updateDelay() {
  document.querySelector('label[for=delay]').innerText = `delay: ${delay.value} ms`;
}
updateDelay();
delay.addEventListener('input', () => updateDelay())

const makeGif = () => {
  gif.on('finished', (blob) => {
    const gifElement = document.createElement('img')
    gifElement.src = URL.createObjectURL(blob);
    document.querySelector('#gif').append(gifElement);
  });

gif.render();
}

function log(text) {
  const p = document.createElement('p');
  p.innerText = text;
  document.querySelector('#log').append(p);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function doMagic() {
  let reflefteye;
  let refeyedistance;
  let refrotation;

  gif = new GIF({
    workers: 2,
    quality: 10,
  });

  document.querySelector('#gif').innerHTML = '';

  if (imageUpload.files.length < 1) {
    log('please select images first!')
    return;
  }

  await asyncForEach([...imageUpload.files], async file => {
    const image = await faceapi.bufferToImage(file)
    const canvas = faceapi.createCanvasFromMedia(image)
    
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
    const rotation = Math.atan((align[1].y - align[0].y) / (align[1].x - align[0].x));
    if (!refrotation) refrotation = rotation;

    const alignhelper = {
      dx: reflefteye.x - align[0].x,
      dy: reflefteye.y - align[0].y,
    }

    log(file.name);
    log(`eyedistance: ${distance}`)

    const ctx = canvas.getContext('2d');

    if (document.querySelector('#debug').checked) { // if debug draw circle around eyes
      align.forEach(a => {
        ctx.beginPath();
        ctx.fillStyle = '#FF0000';
        ctx.arc(a.x, a.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      })
    }
;

    ctx.transform(1, 0, 0, 1, alignhelper.dx, alignhelper.dy); // align left eyes
    ctx.translate(align[0].x, align[0].y); // rotate around left eye
    ctx.rotate(refrotation - rotation);
    ctx.transform(zoom, 0, 0, zoom, 0, 0); // zoom to fit eyedistance (around left eye);
    ctx.translate(-(align[0].x), -(align[0].y))
    await ctx.drawImage(canvas, 0, 0);
    await gif.addFrame(canvas, {delay: delay.value});
  })
  log('makeGif');
  makeGif();
}
imageUpload.addEventListener('change', async () => {
  log('loading images...')
  doMagic();
})
document.querySelector('#doMagic').addEventListener('click', () => doMagic());

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(log('faceapi loaded'))


