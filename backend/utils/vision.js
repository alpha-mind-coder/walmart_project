const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const fs = require('fs');

async function recognizeCategoryFromImage(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const tfimage = tf.node.decodeImage(imageBuffer);
    const model = await mobilenet.load();
    const predictions = await model.classify(tfimage);
    return predictions[0]?.className || 'Unknown';
  } catch (err) {
    console.error('Vision error:', err);
    return 'Unknown';
  }
}

module.exports = { recognizeCategoryFromImage };