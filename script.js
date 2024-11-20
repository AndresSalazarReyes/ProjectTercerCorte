const uploadInput = document.getElementById('upload');
const cameraBtn = document.getElementById('camera-btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const results = document.getElementById('results');

// Función para subir imagen
uploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const base64Image = await toBase64(file);
        identifyImage(base64Image);
    }
});

// Función para usar la cámara
cameraBtn.addEventListener('click', async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        video.hidden = false;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.addEventListener('click', () => {
            canvas.hidden = false;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const base64Image = canvas.toDataURL('image/png');
            video.srcObject.getTracks().forEach(track => track.stop());
            video.hidden = true;
            identifyImage(base64Image);
        });
    } else {
        alert('Tu navegador no soporta acceso a la cámara.');
    }
});

// Convertir imagen a base64
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
});

// Llamar a la API de Visión
async function identifyImage(base64Image) {
    results.innerHTML = "Procesando...";
    try {
        const response = await fetch('https://api.clarifai.com/v2/models/general-image-detection/outputs', {
            method: 'POST',
            headers: {
                'Authorization': 'Key TU_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: [{ data: { image: { base64: base64Image.split(',')[1] } } }]
            })
        });
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        results.innerHTML = "Ocurrió un error al identificar la imagen.";
        console.error(error);
    }
}

// Mostrar resultados
function displayResults(data) {
    if (data.outputs && data.outputs[0].data.concepts) {
        const concepts = data.outputs[0].data.concepts;
        results.innerHTML = concepts.map(c => `<p>${c.name} (${Math.round(c.value * 100)}%)</p>`).join('');
    } else {
        results.innerHTML = "No se pudo identificar el contenido.";
    }
}
