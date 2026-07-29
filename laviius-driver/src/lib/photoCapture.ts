import * as ImageManipulator from "expo-image-manipulator";

/**
 * Intelligent compression before local save/upload. Freight photos need to
 * stay legible (damage, labels, cargo condition) but don't need full sensor
 * resolution — this keeps uploads fast on poor warehouse/dock signal.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.72;

export async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
