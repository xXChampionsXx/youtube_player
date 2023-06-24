import { useState, useEffect, useRef } from "preact/hooks";
import ReactPlayer from "react-player";
import * as types from "../types";

import "./VideoPlayer.css";

function VideoPlayer({
  video,
  onVideoEnd,
  onSkipVideo,
  onPreviousVideo,
}: {
  video: types.Video;
  onVideoEnd: Function;
  onSkipVideo: Function;
  onPreviousVideo: Function;
}) {
  const [audio, setAudio] = useState(undefined as unknown as HTMLAudioElement);

  // Urls and selected Quality
  const [videoQuality, setVideoQuality] = useState(0);
  const [audioQuality, setAudioQuality] = useState(0);
  const [videoUrls, setVideoUrls] = useState([] as types.Format[]);
  const [audioUrls, setAudioUrls] = useState([] as types.Format[]);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loop, setLoop] = useState(false);
  const [isTabFocused, setIsTabFocused] = useState(true);

  // Video element state
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null as unknown as ReactPlayer);

  useEffect(() => {
    if (video?.url)
      fetch(`http://localhost:3001/youtube`, {
        headers: { url: video.url },
      })
        .then((response) => response.json())
        .then((json) => {
          let video = json.video;
          let formats = video.formats;

          if (formats.length < 1) {
            onVideoEnd();
            return;
          }

          let videoFormats = formats.filter((format: types.Format) => {
            return format.mimeType.includes("video/mp4");
          });
          videoFormats = videoFormats.sort((a: types.Format, b: types.Format) => {
            return a.bitrate - b.bitrate;
          });
          setVideoUrls(videoFormats);

          let audioFormats = formats.filter((format: types.Format) => {
            return format.mimeType.includes("audio");
          });
          audioFormats = audioFormats.sort((a: types.Format, b: types.Format) => {
            return a.bitrate - b.bitrate;
          });
          setAudioUrls(audioFormats);
          setDuration(video.videoDetails.lengthSeconds);
        });
  }, [video]);

  useEffect(() => {
    const audio = document.getElementById("audio") as HTMLAudioElement;
    if(audio == null) return;
    setAudio(audio);
    audio.volume = 0.05;
    const volumeSlider: HTMLInputElement = document.getElementById("volume") as HTMLInputElement;
    if(volumeSlider == null) return;
    volumeSlider.value = "5"

    document.addEventListener("visibilitychange", function () {
      setIsTabFocused(!document.hidden);
    });
  }, []);

  function onVideoReady() {
    setTimeout(() => {
      setVideoReady(true);
      if (playing) resume();
    }, 250);
  }

  function onBufferEnd() {
    setTimeout(() => {
      setVideoReady(true);
      if (playing) resume();
    }, 350);
  }

  function resume() {
    if (!videoReady) {
      const wait = () => {
        setTimeout(() => {
          resume();
        }, 350);
      };
      wait();
    } else {
      setVideoPlaying(true);
      audio.play();
    }
  }

  function pause() {
    setVideoPlaying(false);
    audio.pause();
  }

  function play() {
    setPlaying(!playing);
    if (!playing) resume();
    else pause();
  }

  function skip() {
    pause();
    onSkipVideo();
  }

  function previous() {
    pause();
    onPreviousVideo();
  }

  function onProgress(e) {
    const time = e.target.currentTime;
    setCurrentTime(time);

    if (!isTabFocused || videoRef.current == null) return;
    if (
      videoRef.current.getCurrentTime() < time - 0.25 ||
      videoRef.current.getCurrentTime() > time + 0.25
    ) {
      pause();
      videoRef.current.seekTo(time);
    }
  }

  function changeVolume(e) {
    audio.volume = e.target.value / 100;
  }

  function seekTo(e) {
    audio.currentTime = e.target.value;
  }

  function videoEnd() {
    if (loop) {
      audio.currentTime = 0;
    } else {
      onVideoEnd();
    }
  }

  return (
    <div className="VideoPlayer">
      <audio
        id="audio"
        src={audioUrls[audioUrls.length - 1]?.url}
        onTimeUpdate={(e) => onProgress(e)}
        preload="auto"
        onEnded={() => videoEnd()}
        //controls
      />
      <div className="player">
        <div onClick={() => play()}>
          <ReactPlayer
            url={videoUrls[videoUrls.length - 1]?.url}
            onPlay={() => resume()}
            playing={videoPlaying}
            onReady={() => onVideoReady()}
            onBufferEnd={() => onBufferEnd()}
            //onEnded={() => videoEnd()}
            width={"100%"}
            height={"100%"}
            ref={videoRef}
            muted
          />
        </div>
        <div className="backdrop"></div>
        <div className="VideoControls">
          <box-icon
            name="skip-previous"
            color="white"
            onClick={() => previous()}
          ></box-icon>
          <box-icon
            name={playing ? "pause" : "play"}
            color="white"
            onClick={() => play()}
          ></box-icon>
          <box-icon
            name="skip-next"
            color="white"
            onClick={() => skip()}
          ></box-icon>
          <box-icon
            name={loop ? "revision" : "rotate-right"}
            animation-duration="4s"
            color="white"
            class="loop"
            onClick={() => setLoop(!loop)}
          ></box-icon>

          <box-icon
            name="volume-full"
            color="white"
            type="solid"
            class="volume"
          ></box-icon>
          <input
            type="range"
            min="0"
            max="100"
            id="volume"
            onChange={(e) => changeVolume(e)}
          ></input>
        </div>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => seekTo(e)}
          id="progress"
        ></input>
      </div>
    </div>
  );
}

export default VideoPlayer;