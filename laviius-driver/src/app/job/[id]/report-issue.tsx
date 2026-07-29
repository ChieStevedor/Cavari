import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { PhotoGrid } from "@/components/ui/PhotoGrid";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { ISSUE_TYPES } from "@/domain/issues";
import { compressPhoto } from "@/lib/photoCapture";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { CapturedPhoto, IssueType } from "@/types/shipment";

/**
 * One-tap issue reporting, reachable from anywhere in the active
 * workflow. Supports photo, voice, and text notes; submitting notifies
 * dispatch immediately (queued for sync if offline) and puts the
 * shipment into "exception" status without blocking the driver from
 * continuing the job.
 */
export default function ReportIssueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const reportException = useShipmentStore((s) => s.reportException);
  const addPhoto = useShipmentStore((s) => s.addPhoto);

  const [selectedType, setSelectedType] = useState<IssueType | null>(null);
  const [notes, setNotes] = useState("");
  const [localPhotos, setLocalPhotos] = useState<CapturedPhoto[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  if (!shipment) return null;

  const addIssuePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const compressedUri = await compressPhoto(result.assets[0].uri);
    const photoId = addPhoto(shipment.id, "exception", compressedUri);
    setLocalPhotos((prev) => [
      ...prev,
      { id: photoId, category: "exception", localUri: compressedUri, takenAt: new Date().toISOString(), uploadStatus: "pending" },
    ]);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI() ?? null;
      setVoiceUri(uri);
      recordingRef.current = null;
      setIsRecording(false);
      return;
    }
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setIsRecording(true);
  };

  const submit = () => {
    if (!selectedType) return;
    const label = ISSUE_TYPES.find((i) => i.type === selectedType)?.label ?? "Issue";
    reportException(shipment.id, {
      type: selectedType,
      label,
      notes: notes.trim() || undefined,
      voiceNoteUri: voiceUri ?? undefined,
      photoIds: localPhotos.map((p) => p.id),
    });
    router.back();
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Report Issue" subtitle={shipment.shipmentNumber} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {ISSUE_TYPES.map((issue) => {
            const active = selectedType === issue.type;
            return (
              <Pressable
                key={issue.type}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedType(issue.type)}
                className={[
                  "flex-row items-center px-4 py-3 rounded-lg border",
                  active ? "bg-danger-muted border-danger" : "bg-bg-elevated border-border",
                ].join(" ")}
              >
                <Ionicons name={issue.icon} size={18} color={active ? color.danger : color.textSecondary} />
                <Text className={["ml-2 text-[14px] font-medium", active ? "text-danger" : "text-text-primary"].join(" ")}>
                  {issue.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedType ? (
          <View>
            <Text className="text-text-secondary text-[13px] font-semibold uppercase mb-2">Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe what's happening…"
              placeholderTextColor={color.textTertiary}
              multiline
              numberOfLines={4}
              className="min-h-[100px] bg-bg-elevated border border-border rounded-lg px-4 py-3 text-text-primary text-[15px] mb-4"
              textAlignVertical="top"
              accessibilityLabel="Issue notes"
            />

            <Text className="text-text-secondary text-[13px] font-semibold uppercase mb-2">Photos</Text>
            <View className="mb-4">
              <PhotoGrid photos={localPhotos} onAddPress={addIssuePhoto} />
            </View>

            <Text className="text-text-secondary text-[13px] font-semibold uppercase mb-2">Voice Note</Text>
            <Button
              label={isRecording ? "Stop Recording" : voiceUri ? "Re-record Voice Note" : "Record Voice Note"}
              variant={isRecording ? "danger" : "secondary"}
              icon={<Ionicons name={isRecording ? "stop-circle" : "mic-outline"} size={18} color={isRecording ? "#fff" : color.textPrimary} />}
              onPress={toggleRecording}
            />
            {voiceUri && !isRecording ? (
              <Text className="text-go text-[13px] mt-2">Voice note recorded</Text>
            ) : null}
          </View>
        ) : (
          <Text className="text-text-tertiary text-[14px]">Select an issue type to continue.</Text>
        )}
      </ScrollView>
      <PrimaryActionBar label="Notify Dispatcher" onPress={submit} disabled={!selectedType} />
    </View>
  );
}
