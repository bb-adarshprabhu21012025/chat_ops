"use client"

import { useRef, useState, useEffect } from 'react';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    justifyContent: 'center',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  transcriptBox: {
    padding: '1.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    minHeight: '200px',
    backgroundColor: '#f9f9f9',
  }
};

export default function KiriPage() {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const backendSocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const backendSocket = new WebSocket('ws://localhost:8123/ws/deepgram');
    backendSocketRef.current = backendSocket;

    backendSocket.onmessage = (event) => {
      const responseText = event.data;
      setTranscript((prev) => prev + ' ' + responseText);
      console.log("Received from backend:", responseText);
      if (ttsEnabled) {
        playElevenLabsAudio(responseText);
      }
    };

    backendSocket.onerror = (err) => console.error("Backend socket error:", err);
    backendSocket.onclose = () => console.log("Backend socket closed");

    return () => backendSocket.close();
  }, [ttsEnabled]);

  const playElevenLabsAudio = async (text) => {
    const apiKey = 'sk_3e58aaa5efd4abb846e1e228261e77caf18a8c8fe918d633';
    const voiceId = '21m00Tcm4TlvDq8ikWAM';
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.error('ElevenLabs audio playback error:', err);
    }
  };

  const handleTranscriptionToggle = async () => {
    if (isTranscribing) {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsTranscribing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (backendSocketRef.current?.readyState === WebSocket.OPEN) {
            backendSocketRef.current.send(event.data);
          }
        });

        mediaRecorder.start(250);
        setTranscript('');
        setIsTranscribing(true);
      } catch (err) {
        console.error('Failed to start transcription:', err);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Real-Time Transcription + TTS</h1>
      <div style={styles.controls}>
        <button onClick={handleTranscriptionToggle} style={styles.button}>
          {isTranscribing ? 'Stop Transcription' : 'Start Transcription'}
        </button>
        <label>
          <input
            type="checkbox"
            checked={ttsEnabled}
            onChange={(e) => setTtsEnabled(e.target.checked)}
          />
          Enable Text-to-Speech
        </label>
      </div>
      <div style={styles.transcriptBox}>
        {transcript || (isTranscribing ? 'Listening...' : 'Click the button to begin')}
      </div>
    </div>
  );
}