import { exec } from "child_process";
import * as fs from "fs";

export function calculateVMAF(referenceVideo, encodedVideo) {
  console.log("Started execution");
  const response = new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${referenceVideo} -i ${encodedVideo} -filter_complex "[0:v]scale=1280:720:flags=lanczos+full_chroma_inp+full_chroma_int[ref];[1:v]scale=1280:720:flags=lanczos+full_chroma_inp+full_chroma_int[encoded];[ref][encoded]libvmaf=model='path=/usr/local/share/libvmaf/model/vmaf_v0.6.1.json:log_fmt=json:log_path=vmaf-log.json'" -f null -`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log({ stdout, stderr });
        resolve(stdout);
      }
    });
  });
  console.log("Exiting calculate vmaf", response);
  return response;
}

export async function readVMAFScores() {
  console.log("read vmaf scores");
  const data = await fs.promises.readFile("vmaf-log.json", "utf-8");
  const jsonData = JSON.parse(data);
  const frames = jsonData.frames;
  const scores = frames.map((frame) => frame.metrics.vmaf);
  console.log("Exiting read vmaf");
  return scores;
}
