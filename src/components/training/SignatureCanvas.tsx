"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import Button from "@/components/ui/Button";

export type SignatureHandle = {
  isEmpty: () => boolean;
  toDataURL: () => string;
  clear: () => void;
};

const SignatureCanvas = forwardRef<SignatureHandle>((_, ref) => {
  const sigRef = useRef<ReactSignatureCanvas>(null);

  useImperativeHandle(ref, () => ({
    isEmpty: () => sigRef.current?.isEmpty() ?? true,
    toDataURL: () => sigRef.current?.toDataURL("image/png") ?? "",
    clear: () => sigRef.current?.clear(),
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <ReactSignatureCanvas
          ref={sigRef}
          penColor="#1d4ed8"
          canvasProps={{
            width: 600,
            height: 180,
            className: "w-full touch-none",
            style: { maxHeight: 180 },
          }}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => sigRef.current?.clear()}
        className="self-end text-xs text-gray-400"
      >
        다시 그리기
      </Button>
    </div>
  );
});
SignatureCanvas.displayName = "SignatureCanvas";
export default SignatureCanvas;
