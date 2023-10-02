console.log("Recording screen script is running");

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.name !== "startRecordingOnBackground") {
    return;
  }

  try {
    // Prompt user to choose screen or window
    const streamId = await new Promise((resolve) => {
      chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], resolve);
    });

    if (!streamId) {
      console.error("User canceled desktop capture.");
      return;
    }

    // Once the user has chosen a screen or window, create a stream from it and start recording
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: streamId,
        },
      },
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: streamId,
        },
      },
    });

    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = async function (e) {
      // Generate a unique ID for the video name
      const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
      const videoName = `recorded_video.mp4`;

      const blobFile = new Blob(chunks, { type: "video/webm" });
      console.log(blobFile);

      const formData = new FormData();
      formData.append("video", blobFile, videoName);

      const response = await fetch(
        "https://upload-video-3pkk.onrender.com/api/v1/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        alert("Video successfully uploaded.");
        chrome.tabs.create({ url: `https://help-me-out-web-hazel.vercel.app/${videoName}` });
      } else {
        console.error("Error uploading video:", response.statusText);
        console.log("error");
      }

      const downloadLink = document.getElementById("downloadLink");
      downloadLink.href = URL.createObjectURL(blobFile);
      downloadLink.download = `${videoName}.webm`;

      // Show and trigger the download link
      downloadLink.style.display = "block";
      downloadLink.click();

      // Clean up
      URL.revokeObjectURL(blobFile);
      window.close(); // Close the extension popup
      stream.getTracks().forEach((track) => track.stop()); // Stop all tracks of the stream
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("Error starting recording:", error);
  } finally {
    // After all setup, focus on the previous tab (where the recording was requested)
    await chrome.tabs.update(message.body.currentTab.id, {
      active: true,
      selected: true,
    });
  }
});
