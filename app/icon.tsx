import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          background: "#4F46E5",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        ⚡
      </div>
    ),
    {
      ...size,
    }
  );
}
