import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const regular = readFileSync("C:/Windows/Fonts/segoeui.ttf");
const bold = readFileSync("C:/Windows/Fonts/segoeuib.ttf");

const fonts = [
  { name: "Segoe UI", data: regular, weight: 400, style: "normal" },
  { name: "Segoe UI", data: bold, weight: 700, style: "normal" },
];

const el = (type, props = {}, ...children) => ({
  type,
  props: children.length ? { ...props, children } : props,
});

const vnode = el(
  "div",
  {
    style: {
      width: "1200px",
      height: "630px",
      backgroundColor: "#212737",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 80px",
      fontFamily: "Segoe UI",
    },
  },
  el(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "14px" } },
    el("div", {
      style: {
        display: "flex",
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        backgroundColor: "#ff6b01",
      },
    }),
    el(
      "span",
      {
        style: {
          fontSize: "28px",
          color: "#ff6b01",
          fontWeight: 700,
          letterSpacing: "4px",
        },
      },
      "CLOUDZUN"
    )
  ),
    el(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
    el(
      "div",
      {
        style: {
          display: "flex",
          fontSize: "92px",
          fontWeight: 700,
          color: "#eaedf3",
          lineHeight: 1.15,
        },
      },
      "CloudZun"
    ),
    el(
      "div",
      {
        style: {
          display: "flex",
          fontSize: "36px",
          color: "#9aa3b5",
          marginTop: "24px",
        },
      },
      "AI Engineer · Automation Expert · Tech Blogger"
    )
  ),
  el(
    "div",
    { style: { display: "flex", fontSize: "28px", color: "#6b7280" } },
    "cloudzun.com"
  )
);

const svg = await satori(vnode, { width: 1200, height: 630, fonts });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
  .render()
  .asPng();
const jpg = await sharp(png).jpeg({ quality: 88 }).toBuffer();
writeFileSync("public/cloudzun-og.jpg", jpg);
