import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Play, Pause, RotateCcw, Plus, Minus, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  className?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  initialSeconds = 0,
  onComplete,
  onTick,
  className,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play completion sound
  const playCompletionSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();

      // Play a pleasant chime sound
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playNote(523.25, now, 0.3); // C5
      playNote(659.25, now + 0.15, 0.3); // E5
      playNote(783.99, now + 0.3, 0.5); // G5
    } catch (error) {
      console.error('Could not play timer completion sound:', error);
    }
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev - 1;
          if (onTick) {
            onTick(newSeconds);
          }
          return newSeconds;
        });
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      setIsComplete(true);
      playCompletionSound();
      if (onComplete) {
        onComplete();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, seconds, onTick, onComplete, playCompletionSound]);

  // Handle start/pause
  const handleToggle = () => {
    if (isComplete) {
      handleReset();
    } else {
      setIsActive(!isActive);
    }
  };

  // Handle reset
  const handleReset = () => {
    setIsActive(false);
    setSeconds(initialSeconds);
    setIsComplete(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Adjust time
  const handleAdjustTime = (amount: number) => {
    const newSeconds = Math.max(0, seconds + amount);
    setSeconds(newSeconds);
    setIsActive(false);
    setIsComplete(false);
  };

  // Add preset time buttons
  const presetTimes = [60, 300, 600, 900, 1800]; // 1min, 5min, 10min, 15min, 30min

  return (
    <Card className={cn("p-4 md:p-6 shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm", className)}>
      <div className="space-y-4">
        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className={cn(
            "text-6xl md:text-7xl font-mono font-bold tracking-wider transition-all duration-300",
            isComplete ? "text-green-500" : "text-foreground"
          )}>
            {formatTime(seconds)}
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-green-600 font-medium animate-bounce">
              <Bell className="w-5 h-5" />
              <span>Timer Complete!</span>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handleToggle}
            size="lg"
            className={cn(
              "h-14 px-8 text-base font-medium transition-all duration-200",
              isComplete ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : isComplete ? (
              <>
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="h-14 px-4"
            disabled={seconds === initialSeconds && !isActive}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Time Adjustment */}
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => handleAdjustTime(-60)}
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">Adjust</span>
          <Button
            onClick={() => handleAdjustTime(60)}
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Preset Times */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center font-medium">Quick Presets</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {presetTimes.map((preset) => (
              <Button
                key={preset}
                onClick={() => {
                  setSeconds(preset);
                  setIsActive(false);
                  setIsComplete(false);
                }}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                {preset >= 60 ? `${preset / 60}m` : `${preset}s`}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
