export function formatTimeDiff(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const totalSeconds = Math.max(Math.floor(diffMs / 1000), 0); // prevent negative times
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  