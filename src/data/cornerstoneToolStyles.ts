import { viewportIds } from "./cornerstoneIds";
import { LengthTool } from "@cornerstonejs/tools";

export const viewportColors = {
  [viewportIds[0]]: "rgb(200, 0, 0)",
  [viewportIds[1]]: "rgb(200, 100, 0)",
  [viewportIds[2]]: "rgb(0, 200, 0)",
};

export const newStyles = {
  [LengthTool.toolName]: {
    color: "#d70",
    colorHighlighted: "#f00",
    colorSelected: "#f90",
    textBoxFontSize: "0.75rem",
    textBoxColor: "#d70",
    textBoxColorHighlighted: "#f00",
    textBoxColorSelected: "#f90",
  },
  global: {
    lineDash: "5,3",
  },
};
