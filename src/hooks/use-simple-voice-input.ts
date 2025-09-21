'use client';

import React, { useState, useRef, useCallback } from 'react';

// TypeScript interfaces for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: any) => any) | null;
}

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

// Simple state machine for voice input
type VoiceState =
  | 'idle'           // Not recording
  | 'requesting'     // Requesting microphone permission
  | 'recording'      // Actively recording
  | 'processing'     // Processing the transcript
  | 'completed'      // Completed with result
  | 'error';         // Error state

interface VoiceInputOptions {
  lang?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface VoiceInputResult {
  // State
  state: VoiceState;
  transcript: string;
  error: string | null;

  // Metrics
  recordingTime: number; // in seconds
  isSupported: boolean;
  hasPermission: boolean | null;

  // Controls
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

export function useSimpleVoiceInput(options: VoiceInputOptions = {}): VoiceInputResult {
  const {
    lang = 'en-US',
    onTranscript,
    onError,
  } = options;

  // State management
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Refs for cleanup and timers
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  // Clear any existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setRecordingTime(elapsed);
    }, 1000);
  }, []);

  // Handle errors
  const handleError = useCallback((errorMessage: string) => {
    setState('error');
    setError(errorMessage);
    clearTimer();
    onError?.(errorMessage);
  }, [clearTimer, onError]);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      setHasPermission(false);
      const errorMessage = err instanceof Error ? err.message : 'Microphone permission denied';
      handleError(`Microphone access denied: ${errorMessage}`);
      return false;
    }
  }, [handleError]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      handleError('Speech recognition is not supported in this browser');
      return;
    }

    if (state !== 'idle') {
      return; // Already in process
    }

    setState('requesting');
    setError(null);
    setTranscript('');
    setRecordingTime(0);

    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      return; // Error already handled in requestMicrophonePermission
    }

    try {
      // Create new speech recognition instance
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        handleError('Speech recognition is not available');
        return;
      }
      const recognition = new SpeechRecognitionClass();

      // Configure recognition - SIMPLE settings
      recognition.continuous = false; // Stop after one result
      recognition.interimResults = false; // Only final results
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      // Set up event handlers
      recognition.onstart = () => {
        setState('recording');
        startTimer();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0];
        if (result && result.isFinal) {
          const transcriptText = result[0].transcript.trim();
          setTranscript(transcriptText);
          setState('completed');
          clearTimer();
          onTranscript?.(transcriptText);
        }
      };

      recognition.onerror = (event: any) => {
        const errorMessage = event.error || 'Speech recognition error';
        handleError(`Recording failed: ${errorMessage}`);
      };

      recognition.onend = () => {
        // Only process onend if we're still in a recording-related state
        if (recognitionRef.current) {
          if (transcript) {
            setState('completed');
          } else {
            handleError('No speech detected. Please try again.');
          }
        }
        clearTimer();
      };

      // Store reference and start
      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      handleError(errorMessage);
    }
  }, [isSupported, state, lang, handleError, requestMicrophonePermission, startTimer, clearTimer, onTranscript, transcript]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && (state === 'recording' || state === 'requesting')) {
      setState('processing');
      recognitionRef.current.stop();
      clearTimer();
    }
  }, [state, clearTimer]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    clearTimer();
    setState('idle');
    setTranscript('');
    setError(null);
    setRecordingTime(0);
  }, [clearTimer]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      clearTimer();
    };
  }, [clearTimer]);

  return {
    // State
    state,
    transcript,
    error,

    // Metrics
    recordingTime,
    isSupported,
    hasPermission,

    // Controls
    startRecording,
    stopRecording,
    reset,
  };
}