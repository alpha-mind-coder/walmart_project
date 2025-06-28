document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('start-button');
  const scannerElement = document.getElementById('scanner');
  const resultElement = document.getElementById('result');
  
  let scannerActive = false;
  let lastScanTime = 0;
  const testImages = [
  'https://i.imgur.com/JK9SUP1.jpg', // Clean EAN-13
  'https://i.imgur.com/8NHQx4a.jpg'  // Noisy UPC-A
];

  // Optimized configuration
  const config = {
    inputStream: {
      type: "LiveStream",
      target: scannerElement,
      constraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment",
        focusMode: "continuous"
      }
    },
    decoder: {
      readers: ["ean_reader", "ean_8_reader", "upc_reader"],
      debug: {
        drawBoundingBox: true,
        showPattern: true
      }
    },
    locator: {
      patchSize: "medium",
      halfSample: true
    }
  };

  startButton.addEventListener('click', async function() {
    if (scannerActive) {
      Quagga.stop();
      scannerElement.srcObject.getTracks().forEach(track => track.stop());
      startButton.textContent = 'Start Scanner';
      scannerActive = false;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: config.inputStream.constraints
      });
      
      scannerElement.srcObject = stream;
      startButton.textContent = 'Stop Scanner';
      scannerActive = true;

      Quagga.init(config, function(err) {
        if (err) {
          console.error("Quagga error:", err);
          resultElement.textContent = "Scanner error: " + err.message;
          return;
        }

        console.log("Quagga initialized successfully");
        
        Quagga.onDetected(function(result) {
          const now = Date.now();
          if (now - lastScanTime > 1000) { // 1 second delay between scans
            lastScanTime = now;
            const code = result.codeResult.code;
            const format = result.codeResult.format;
            
           console.log("Barcode detected:", code, format);
resultElement.innerHTML = `
  <strong>Scanned:</strong> ${code}<br>
  <small>Format: ${format}</small>
`;

// 🔗 Send the barcode to backend for product lookup
fetch("http://localhost:3000/api/products/scan", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ value: code })
})
.then(res => res.json())
.then(data => {
  if (data.name) {
    resultElement.innerHTML += `<br><strong>Product:</strong> ${data.name} - ₹${data.price}`;
  } else if (data.error) {
    resultElement.innerHTML += `<br><span style="color: red">${data.error}</span>`;
  }
})
.catch(err => {
  resultElement.innerHTML += `<br><span style="color: red">Server error</span>`;
  console.error("Fetch error:", err);
});

          }
        });

        Quagga.start();
      });

    } catch (err) {
      console.error("Camera error:", err);
      resultElement.textContent = "Error: " + err.message;
    }
  });
});

//

//

// Add this after your camera scanner initialization
const imageUpload = document.createElement('input');
imageUpload.type = 'file';
imageUpload.accept = 'image/*';
imageUpload.style.display = 'none';
imageUpload.id = 'barcode-image-upload';
document.body.appendChild(imageUpload);

// Add upload button next to camera button
const uploadButton = document.createElement('button');
uploadButton.textContent = '📁 Upload Image';
uploadButton.className = 'scan-button';
document.getElementById('controls').appendChild(uploadButton);

// Image scanning handler
uploadButton.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // Create temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Use Quagga's static image scanner
      Quagga.decodeSingle({
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "code_128_reader"]
        },
        locate: true,
        src: canvas.toDataURL()
      }, (result) => {
        if (result?.codeResult) {
          processBarcode(result.codeResult);
        } else {
          document.getElementById('result').innerHTML = 
            '<p class="error">No barcode found. Try a clearer image.</p>';
        }
      });
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});