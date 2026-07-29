import { forwardRef } from "react";
import { View } from "react-native";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";

import { color } from "@/constants/theme";

interface SignaturePadProps {
  onCapture: (dataUri: string) => void;
}

const WEB_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; }
  body,html { background-color: ${color.bgElevated2}; }
`;

/** Thin wrapper so the rest of the app never touches the underlying
 * WebView-based signature library directly. Parent calls
 * `ref.current.readSignature()` to trigger `onCapture` with the PNG data
 * URI, and `ref.current.clearSignature()` to reset. */
export const SignaturePad = forwardRef<SignatureViewRef, SignaturePadProps>(({ onCapture }, ref) => {
  return (
    <View className="h-64 rounded-xl overflow-hidden bg-bg-elevated-2 border border-border">
      <SignatureScreen
        ref={ref}
        onOK={onCapture}
        webStyle={WEB_STYLE}
        backgroundColor={color.bgElevated2}
        penColor={color.textPrimary}
        autoClear={false}
        descriptionText=""
      />
    </View>
  );
});
SignaturePad.displayName = "SignaturePad";

export type { SignatureViewRef };
