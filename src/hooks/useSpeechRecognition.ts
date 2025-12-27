import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '@/types/speech';

// Enhanced Speech Recognition Hook optimized for mobile
export interface UseSpeechRecognitionOptions {
 continuous?: boolean;
 interimResults?: boolean;
 lang?: string;
 timeout?: number; // Timeout in milliseconds
 onResult?: (transcript: string, isFinal: boolean) => void;
 onEnd?: () => void;
 onError?: (error: string) => void;
 mobileOptimized?: boolean; // New option for mobile optimization
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Mobile-optimized Speech Recognition
export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    timeout = 3000, // Default 3 seconds
    onResult,
    onEnd,
    onError,
    mobileOptimized = false, // Default false for backward compatibility
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [manuallyStopped, setManuallyStopped] = useState(false);
  const isListeningRef = useRef(false);
  const manuallyStoppedRef = useRef(false);
  const forceStoppedRef = useRef(false); // New ref to prevent any restart attempts
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition with mobile optimizations
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Mobile-optimized settings
       recognition.continuous = continuous;
       recognition.interimResults = interimResults;
       recognition.lang = lang;
       recognition.maxAlternatives = 1;
      
      // Mobile-optimized audioend handler - only restart if explicitly needed
       recognition.addEventListener('audioend', () => {
         isListeningRef.current = false;
         // Only restart if NOT manually stopped, NOT force stopped, and still supposed to be listening
         // Add additional check to prevent unwanted restarts on mobile
         // IMPORTANT: Use isListeningRef.current instead of isListening (state) because state is asynchronous
         if (isListeningRef.current && continuous && !manuallyStoppedRef.current && !forceStoppedRef.current) {
           // Small delay to prevent rapid restarts
           audioendTimeoutRef.current = setTimeout(() => {
             // Triple check all conditions before restarting - ensure manuallyStopped and forceStopped are still false
             if (isListeningRef.current && !manuallyStoppedRef.current && !forceStoppedRef.current && recognitionRef.current) {
               try {
                 recognitionRef.current.start();
                 isListeningRef.current = true;
               } catch (e) {
                 // Ignore if already started
               }
             }
           }, 100);
         }
       });
      
      
      recognition.addEventListener('result', (event) => {
        // Reset inactivity timeout on speech detection
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
        
        // Set new inactivity timeout - longer for mobile to prevent unwanted stops
         if (timeout > 0 && isListeningRef.current) {
           inactivityTimeoutRef.current = setTimeout(() => {
             if (isListeningRef.current && recognitionRef.current && !manuallyStoppedRef.current) {
               try {
                 recognitionRef.current.abort();
                 setIsListening(false);
                 isListeningRef.current = false;
               } catch (error) {
                 console.error('Failed to stop recognition on timeout:', error);
               }
             }
           }, timeout);
         }

        // Set auto-stop timeout (longer for mobile to prevent unwanted stops)
         if (isListeningRef.current && !manuallyStoppedRef.current) {
           if (autoStopTimeoutRef.current) {
             clearTimeout(autoStopTimeoutRef.current);
           }
           autoStopTimeoutRef.current = setTimeout(() => {
             if (isListeningRef.current && !manuallyStoppedRef.current && recognitionRef.current) {
               try {
                 // Use abort instead of stop for more forceful termination
                 recognitionRef.current.abort();
                 setIsListening(false);
                 isListeningRef.current = false;
               } catch (error) {
                 console.error('Failed to auto-stop recognition:', error);
               }
             }
           }, 8000); // 8 seconds - longer for mobile but still auto-stop
         }
        
        let interimTranscript = '';
        let finalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        if (finalText) {
          setFinalTranscript(prev => prev + finalText);
          onResult?.(finalText, true);
        }
        
        if (interimTranscript) {
          setTranscript(interimTranscript);
          onResult?.(interimTranscript, false);
        }
      });

      recognition.addEventListener('error', (event) => {
        // Handle aborted error (often occurs during normal operation)
        if (event.error === 'aborted') {
          // Don't stop listening for aborted errors, as they often happen during normal operation
          // The audioend handler will restart recognition if needed
          return;
        }

        // Handle no-speech error more gracefully - don't stop listening immediately
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
          // Don't call onError for no-speech, as it's not really an error in this context
          return;
        }

        console.error('Speech recognition error:', event.error);
        onError?.(event.error);

        // Handle mobile-specific errors
        if (event.error === 'network' || event.error === 'not-allowed') {
          setIsListening(false);
        }
      });

      recognition.addEventListener('end', () => {
        isListeningRef.current = false;
        
        // Only call onEnd if not manually stopped
        if (!manuallyStoppedRef.current) {
          onEnd?.();
        }
        
        if (!continuous || manuallyStoppedRef.current) {
          setIsListening(false);
          setManuallyStopped(false); // Reset manual stop flag
          manuallyStoppedRef.current = false;
        }
      });

      recognitionRef.current = recognition;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
      if (audioendTimeoutRef.current) {
        clearTimeout(audioendTimeoutRef.current);
      }
    };
  }, [continuous, interimResults, lang, onResult, onEnd, onError]);

  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
      if (audioendTimeoutRef.current) {
        clearTimeout(audioendTimeoutRef.current);
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;

    try {
      setIsListening(true);
      isListeningRef.current = true;
      setManuallyStopped(false); // Reset manual stop flag when starting
      manuallyStoppedRef.current = false;
      forceStoppedRef.current = false; // Reset force stop flag when starting
      setTranscript('');
      setFinalTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Immediately set all flags to prevent any restarts (synchronous)
    setIsListening(false);
    isListeningRef.current = false;
    setManuallyStopped(true);
    manuallyStoppedRef.current = true;
    forceStoppedRef.current = true; // Set force stop flag immediately to prevent any restart attempts

    // Clear all timeouts immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (audioendTimeoutRef.current) {
      clearTimeout(audioendTimeoutRef.current);
      audioendTimeoutRef.current = null;
    }

    // Force stop the recognition immediately with multiple methods (synchronous)
    try {
      // Abort is more forceful than stop - try multiple times immediately
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
      recognitionRef.current.abort();
    } catch (error) {
      // If abort fails, try stop multiple times
      try {
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
        recognitionRef.current.stop();
      } catch (stopError) {
        console.error('Failed to stop speech recognition:', stopError);
      }
    }

    // Force state cleanup immediately (synchronous)
    setIsListening(false);
    isListeningRef.current = false;
    forceStoppedRef.current = true;

    // Additional safety: ensure no restart can happen (minimal delay)
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        // Double-check force stop flag
        forceStoppedRef.current = true;
      } catch (e) {
        // Ignore errors
      }
    }, 10);

    // Final safety check (minimal delay)
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        forceStoppedRef.current = true;
      } catch (e) {
        // Ignore errors
      }
    }, 25);

    // Mobile-specific: Add additional cleanup to prevent microphone staying on (minimal delay)
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          // Force disconnect and cleanup
          recognitionRef.current.abort();
        }
        forceStoppedRef.current = true;
      } catch (e) {
        // Ignore errors
      }
    }, 50);

    // Final cleanup - ensure everything is stopped (minimal delay)
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
          // Force state cleanup
          setIsListening(false);
          isListeningRef.current = false;
        }
        forceStoppedRef.current = true;
      } catch (e) {
        // Ignore errors
      }
    }, 100);

    // Extra cleanup for mobile devices (minimal delay)
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        // Force state reset even if recognition ref is null
        setIsListening(false);
        isListeningRef.current = false;
        forceStoppedRef.current = true;
      } catch (e) {
        // Ignore errors
      }
    }, 200);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  const returnValue = useMemo(() => ({
    isSupported,
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
  }), [isSupported, isListening, transcript, finalTranscript, startListening, stopListening, resetTranscript]);
  
  return returnValue;
};
