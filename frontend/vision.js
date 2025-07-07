let cocoModel, mobilenetModel;

// Load models once
(async function loadModels() {
  cocoModel = await cocoSsd.load();
  mobilenetModel = await mobilenet.load();
  console.log("✅ Models ready");
})();

// 📷 Reset UI and show camera when "Start Scanner" is tapped
document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("scanner").style.display = "block"; // Show live video
  const canvas = document.getElementById("scanner-overlay");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear old image & bounding boxes

  document.getElementById("result").textContent = "Ready to scan barcode...";
  document.getElementById("productCard").innerHTML = "";
});

// 👜 Handle bag image upload and scan
document.getElementById("fullBagInput").addEventListener("change", async (e) => {
  const imageFile = e.target.files[0];
  if (!imageFile || !cocoModel || !mobilenetModel) return;

  const scanBtn = document.getElementById("bag-scan-button");
  scanBtn.textContent = "🛍️ Scanning...";

  const img = new Image();
  img.src = URL.createObjectURL(imageFile);

  img.onload = async () => {
    document.getElementById("scanner").style.display = "none"; // Hide camera during scan
    scanBtn.textContent = "🛍️ Scan Full Bag";

    const canvas = document.getElementById("scanner-overlay");
    const ctx = canvas.getContext("2d");

    const container = document.getElementById("scanner-container");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const predictions = await cocoModel.detect(img);
    console.log("📦 Detected items:", predictions);

    let cart = {};
    const products = [
      { name: "banana", price: 10 },
      { name: "bottle", price: 40 },
      { name: "laptop", price: 30000 },
      { name: "apple", price: 20 },
      { name: "maggi", price: 15 },
      { name: "book", price: 150 },
      { name: "pepsi", price: 35 }
    ];

    for (const prediction of predictions) {
      if (prediction.score < 0.6) continue;

      const [x, y, width, height] = prediction.bbox;
      const cropped = ctx.getImageData(x, y, width, height);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.putImageData(cropped, 0, 0);

      const tfImg = tf.browser.fromPixels(tempCanvas);
      const classifierResult = await mobilenetModel.classify(tfImg);
      const label = classifierResult[0]?.className.toLowerCase() || "unknown";

      const matched = products.find(p =>
        label.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(label)
      );
      if (matched) {
        cart[matched.name] = cart[matched.name] || { ...matched, count: 0 };
        cart[matched.name].count += 1;
      }

      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      ctx.font = "14px Arial";
      ctx.fillStyle = "green";
      ctx.fillText(label, x, y > 20 ? y - 5 : y + 20);
    }

    const resultDiv = document.getElementById("result");
    const cardDiv = document.getElementById("productCard");
    let total = 0;

    if (Object.keys(cart).length > 0) {
      resultDiv.innerHTML = "<strong>🛍️ Bag Scan Results</strong>";
      cardDiv.innerHTML = "";

      for (const key in cart) {
        const item = cart[key];
        total += item.count * item.price;
        cardDiv.innerHTML += `<div>✔️ ${item.name} × ${item.count} = ₹${item.count * item.price}</div>`;
      }

      cardDiv.innerHTML += `<hr><strong>Total: ₹${total}</strong>`;
    } else {
      resultDiv.innerText = "No recognizable products detected in the bag.";
      cardDiv.innerHTML = "";
    }
  };
});