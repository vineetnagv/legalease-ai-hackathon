'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type VoiceState = 'idle' | 'requesting' | 'recording' | 'processing' | 'completed' | 'error';

interface VoiceRecordingIndicatorProps {
  state: VoiceState;
  recordingTime: number;
  transcript?: string;
  error?: string | null;
  className?: string;
}

export function VoiceRecordingIndicator({
  state,
  recordingTime,
  transcript,
  error,
  className
}: VoiceRecordingIndicatorProps) {
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get state-specific content
  const getStateContent = () => {
    switch (state) {
      case 'idle':
        return null;

      case 'requesting':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Requesting Microphone Access
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Please allow microphone permission to continue
              </p>
            </div>
          </motion.div>
        );

      case 'recording':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
          >
            {/* Pulsing microphone icon */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <Mic className="h-5 w-5 text-red-600 dark:text-red-400" />

              {/* Recording pulse ring */}
              <motion.div
                animate={{
                  scale: [1, 2],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-full bg-red-500"
              />
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Recording...
                </p>
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <Clock className="h-3 w-3" />
                  {formatTime(recordingTime)}
                </div>
              </div>

              {/* Visual waveform animation */}
              <div className="flex items-center gap-1 mt-2">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: [2, Math.random() * 12 + 4, 2],
                    }}
                    transition={{
                      duration: 0.5 + Math.random() * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }}
                    className="w-1 bg-red-400 dark:bg-red-500 rounded-full"
                    style={{ height: 2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Processing Speech
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Converting your speech to text...
              </p>
            </div>
          </motion.div>
        );

      case 'completed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Speech Recognized
              </p>
              {transcript && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">
                  "{transcript}"
                </p>
              )}
            </div>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Recording Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {error || 'An error occurred during recording'}
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        className={cn("w-full", className)}
        layout
      >
        {getStateContent()}
      </motion.div>
    </AnimatePresence>
  );
}

// Simplified microphone button component
interface VoiceMicButtonProps {
  state: VoiceState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceMicButton({
  state,
  onStart,
  onStop,
  disabled = false,
  className
}: VoiceMicButtonProps) {
  const isRecording = state === 'recording';
  const isActive = state !== 'idle' && state !== 'error';

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || state === 'requesting' || state === 'processing'}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
        {
          "bg-red-500 hover:bg-red-600 text-white": isRecording,
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700": !isRecording && !disabled,
          "bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50": disabled,
          "bg-blue-100 dark:bg-blue-900": isActive && !isRecording,
        },
        className
      )}
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {/* Recording pulse ring */}
      {isRecording && (
        <motion.div
          animate={{
            scale: [1, 1.8],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="absolute inset-0 rounded-full bg-red-500"
        />
      )}

      {state === 'requesting' || state === 'processing' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="h-4 w-4" />
        </motion.div>
      ) : state === 'error' ? (
        <MicOff className="h-4 w-4 text-red-500" />
      ) : (
        <Mic className={cn(
          "h-4 w-4",
          isRecording ? "text-white" : "text-gray-600 dark:text-gray-400"
        )} />
      )}
    </motion.button>
  );
}