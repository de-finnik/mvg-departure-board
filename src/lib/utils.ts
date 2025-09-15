export function formatTimeDiff(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const totalSeconds = Math.max(Math.floor(diffMs / 1000), 0); // prevent negative times
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor((totalSeconds % 60) / 10) * 10; // round down to nearest 10
    if (minutes>59) {
      return "> 1h";
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  