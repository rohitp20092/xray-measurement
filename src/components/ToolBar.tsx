import { useState } from "react";
import {
  clearMeasurements,
  toggleSlabScroll,
  toggleTool,
} from "../utils/toolHelper";
import { CrosshairsTool, LengthTool } from "@cornerstonejs/tools";
import {
  handleCsResetCamera,
  handleCsSetSlabThickness,
} from "../utils/helpers";

type ToolBarProps = {
  setIsShowViewer: React.Dispatch<React.SetStateAction<boolean>>;
  isShowViewer: boolean;
};

export default function ToolBar({
  setIsShowViewer,
  isShowViewer,
}: ToolBarProps) {
  const [selectedTool, setSelectedTool] = useState<"crosshairs" | "length">(
    "crosshairs"
  );
  const [isSlabScroll, setIsSlabScroll] = useState(false);

  return (
    <div className="mt-3 flex justify-center gap-4">
      <ToolBarButton
        selected={selectedTool === "length"}
        onClick={() => {
          toggleTool(LengthTool.toolName);
          setSelectedTool("length");
        }}
        disabled={!isShowViewer}
      >
        Length
      </ToolBarButton>
    </div>
  );
}

function ToolBarButton({
  ...props
}: React.PropsWithChildren<React.BaseHTMLAttributes<HTMLButtonElement>> & {
  selected?: boolean;
  disabled?: boolean;
}) {
  const { children, selected, disabled } = props;

  return (
    <button
      {...props}
      className={`text-xs border border-black p-2 rounded ${selected && "bg-slate-300"
        } ${disabled && "opacity-50"}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
