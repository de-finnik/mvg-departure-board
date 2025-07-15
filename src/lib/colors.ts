const colors: Record<string, string> = {
  U1: "#52822f",
  U2: "#c20831",
  U3: "#ec6726",
  U4: "#00a984",
  U5: "#bb7a00",
  U6: "#0065ad",
  S1: "#1b9fc6",
  S2: "#69a338",
  S3: "#973083",
  S4: "#e23331",
  S5: "#136680",
  S6: "#008d5e",
  S7: "#883b32",
  S8: "#2d2b29",
  tram: "#E30613",
  bus: "#00586A"
};

export function getLineBackground(line: string) {
  if(line in colors) {
    return colors[line];
  } else if(parseInt(line) < 50) {
      return colors.tram;
  }
  return colors.bus;
}

export function getLineFontcolor(line: string) {
  return line === "S8" ? "#fdce32": "#fff";
}
