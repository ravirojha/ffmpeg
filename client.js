const API_ENDPOINT = "http://localhost:3000/thumbnail";
const API_ENDPOINT_2 = "http://localhost:3000/split";
const API_ENDPOINT_3 = "http://localhost:3000/convert";
const API_ENDPOINT_4 = "http://localhost:3000/vmaf";

const fileInput = document.querySelector("#file-input");
const submitButton = document.querySelector("#submit");
const thumbnailPreview = document.querySelector("#thumbnail");
const errorDiv = document.querySelector("#error");

function showError(msg) {
  errorDiv.innerText = `ERROR: ${msg}`;
}

// async function blobToDataURL(blob) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result);
//         reader.onerror = () => reject(reader.error);
//         reader.onabort = () => reject(new Error("Read aborted"));
//         reader.readAsDataURL(blob);
//     });
// }
// async function createThumbnail(video) {
//     const payload = new FormData();
//     payload.append('video', video);

//     const res = await fetch(API_ENDPOINT, {
//         method: 'POST',
//         body: payload
//     });

//     if (!res.ok) {
//         throw new Error('Creating thumbnail failed');
//     }

//     const thumbnailBlob = await res.blob();
//     return await blobToDataURL(thumbnailBlob);
// }

// async function Createm3u8(video) {
//     const payload = new FormData();
//     payload.append('video', video);

//     const res = await fetch(API_ENDPOINT_2, {
//         method: 'POST',
//         body: payload
//     });

//     if (!res.ok) {
//         throw new Error('Creating m3u8 failed');
//     }

//     const thumbnailBlob = await res.blob();
//     return await blobToDataURL(thumbnailBlob);
// }

// submitButton.addEventListener('click', async () => {
//     console.log('submit')
//     const { files } = fileInput;

//     if (files.length > 0) {
//         const file = files[0];
//         try {
//             thumbnailPreview.src = await createThumbnail(file);
//         } catch(error) {
//             showError(error);
//         }
//     } else {
//         showError('Please select a file');
//     }
// });

// createButton.addEventListener('click', async () => {
//     console.log('create')

//     const { files } = fileInput;

//     if (files.length > 0) {
//         const file = files[0];
//         try {
//             const m3u8Video = await Createm3u8(file);

//             console.log({m3u8Video})

//             if (Hls.isSupported()) {
//                 const video = document.getElementById('videoPlayer');
//                 const hls = new Hls();

//                 // Replace 'your-m3u8-url' with the URL of your HLS m3u8 video file
//                 const m3u8Url = m3u8Video;

//                 hls.loadSource(m3u8Url);
//                 hls.attachMedia(video);
//                 hls.on(Hls.Events.MANIFEST_PARSED, function() {
//                     video.play();
//                 });
//             } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
//                 // Use native HLS support on Safari
//                 const video = document.getElementById('videoPlayer');
//                 video.src = m3u8Video;
//                 video.addEventListener('loadedmetadata', function() {
//                     video.play();
//                 });
//             } else {
//                 console.error('HLS is not supported in this browser.');
//             }
//         } catch(error) {
//             showError(error);
//         }
//     } else {
//         showError('Please select a file');
//     }
// });

async function downloadIncomingFiles(file) {
  try {
    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch(API_ENDPOINT_3, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to convert video: ${response.statusText}`);
    }

    const responseData = await response.json();

    if (
      responseData.convertedVideos &&
      responseData.convertedVideos.length > 0
    ) {
      responseData.convertedVideos.forEach((videoData) => {
        // Create a Blob from the base64-encoded data
        const videoBlob = new Blob([videoData.data], { type: "video/mp4" });

        // Create a temporary <a> element to trigger the download
        const a = document.createElement("a");
        a.href = URL.createObjectURL(videoBlob);
        a.download = videoData.outputFileName;

        // Trigger the click event to initiate the download
        a.click();

        // Clean up the temporary <a> element and the URL object
        URL.revokeObjectURL(a.href);
      });
    } else {
      throw new Error("No converted videos found in the response");
    }
  } catch (error) {
    throw error;
  }
}

const getvmafscores = async (filePaths) => {
  console.log(filePaths);
  const response = await fetch(API_ENDPOINT_4, {
    method: "POST",
    body: JSON.stringify({
      filePaths: filePaths,
    }),
  });

  console.log(response);
};

submitButton.addEventListener("click", async (e) => {
  console.log("submit");
  e.preventDefault();
  const { files } = fileInput;
  const filePaths = [
    "output_1280x720_18.mp4",
    "output_1280x720_24.mp4",
    "output_1920x1080_18.mp4",
    "output_1920x1080_24.mp4",
  ];

  const file = files[0];
  try {
    // const response = await downloadIncomingFiles(file);
    const response = await getvmafscores(filePaths);
  } catch (error) {
    showError(error);
  }
});
