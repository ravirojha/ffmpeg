import express from "express";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import multer from "multer";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import tmp from "tmp-promise";
import { calculateVMAF, readVMAFScores } from "./utils.js";
const app = express();
const port = 3000;

app.use(cors());

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define a function to calculate video resolution
async function getVideoResolution(fileBuffer) {
  const response = new Promise((resolve, reject) => {
    ffmpeg.ffprobe("./input-video.mp4", (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const resolution = `${metadata.streams[0].width}x${metadata.streams[0].height}`;
        resolve(resolution);
      }
    });
  });
  return response;
}

// Define a function to convert the video to different resolutions and CRF values
async function convertVideo(resolutions, crfValues) {
  const files = [];
  const response = new Promise(async (resolve, reject) => {
    const convertedVideos = [];

    for (let resolution of resolutions) {
      for (let crf of crfValues) {
        const outputFileName = `output_${resolution}_${crf}.mp4`;
        files.push(outputFileName);
        ffmpeg()
          .input("./input-video.mp4")
          .videoCodec("libx264")
          .size(resolution)
          .outputOptions(`-crf ${crf}`)
          .toFormat("mp4")
          .on("end", () => {
            convertedVideos.push({ resolution, crf, outputFileName });
            if (
              convertedVideos.length ===
              resolutions.length * crfValues.length
            ) {
              resolve(convertedVideos);
            }
          })
          .on("error", (err) => {
            reject(err);
          })
          .save(outputFileName);
      }
    }
  });

  return { response, files };
}

// Express route to handle video conversion
app.post("/convert", upload.single("video"), async (req, res) => {
  try {
    const resolutions = ["1280x720", "1920x1080"];
    const crfValues = [18, 24];

    const resolution = await getVideoResolution();
    console.log({ resolution });
    const { response: convertedVideos, files } = await convertVideo(
      resolutions,
      crfValues
    );

    res.json({
      originalResolution: resolution,
      convertedVideos,
      filePaths: files,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred during video conversion." });
  }
});

app.post("/vmaf", async (req, res) => {
  try {
    const filePaths = [
      "output_1280x720_18.mp4",
      "output_1280x720_24.mp4",
      "output_1920x1080_18.mp4",
      "output_1920x1080_24.mp4",
    ];
    console.log({ filePaths });
    for (let file of filePaths) {
      const referenceVideo = "./input-video.mp4";
      const encodedVideo = `./${file}`;
      const response = await calculateVMAF(referenceVideo, encodedVideo);
      console.log({ response });
      const vmafScores = await readVMAFScores();
      console.log({ vmafScores });
    }
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
