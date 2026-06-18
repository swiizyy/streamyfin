import { useQueryClient } from "@tanstack/react-query";
import { Directory, Paths } from "expo-file-system";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/common/Text";
import type { TVOptionItem } from "@/components/tv";
import {
  TVAppearanceSection,
  TVBufferAndVideoSection,
  TVLogoutButton,
  TVSectionHeader,
  TVSettingsOptionButton,
  TVSettingsRow,
  TVSubtitlesSection,
  TVUserSwitchSection,
} from "@/components/tv";
import { useScaledTVTypography } from "@/constants/TVTypography";
import { useTVOptionModal } from "@/hooks/useTVOptionModal";
import { clearCache as clearAudioCache } from "@/providers/AudioStorage";
import {
  apiAtom,
  cacheVersionAtom,
  useJellyfin,
  userAtom,
} from "@/providers/JellyfinProvider";
import {
  AudioTranscodeMode,
  InactivityTimeout,
  useSettings,
} from "@/utils/atoms/settings";
import { storage } from "@/utils/mmkv";
import { clearTopShelfCacheSafely } from "@/utils/topshelf/cache";

export default function SettingsTV() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { logout } = useJellyfin();
  const [user] = useAtom(userAtom);
  const [api] = useAtom(apiAtom);
  const [, setCacheVersion] = useAtom(cacheVersionAtom);
  const { showOptions } = useTVOptionModal();
  const typography = useScaledTVTypography();
  const queryClient = useQueryClient();

  const handleClearCache = async () => {
    Alert.alert(
      t("home.settings.storage.clear_all_cache_confirm"),
      t("home.settings.storage.clear_all_cache_confirm_desc"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.ok"),
          onPress: async () => {
            try {
              storage.remove("REACT_QUERY_OFFLINE_CACHE");
              await queryClient.resetQueries();

              await Image.clearDiskCache();
              Image.clearMemoryCache();

              await clearAudioCache();

              clearTopShelfCacheSafely();

              storage.remove("downloadedSubtitles.json");
              const subtitlesDir = new Directory(
                Paths.cache,
                "streamyfin-subtitles",
              );
              if (subtitlesDir.exists) {
                await subtitlesDir.delete();
              }

              const keysToKeep = [
                "settings",
                "serverUrl",
                "token",
                "user",
                "deviceId",
                "previousServers",
                "hasAskedForNotificationPermission",
                "hasShownIntro",
                "multiAccountMigrated",
                "selectedTVServer",
                "downloads.v2.json",
              ];
              const allKeys = storage.getAllKeys();
              for (const key of allKeys) {
                if (!keysToKeep.includes(key)) {
                  storage.remove(key);
                }
              }

              setCacheVersion((v) => v + 1);
            } catch (error) {
              console.error("Failed to clear cache:", error);
              Alert.alert(
                t("home.settings.toasts.error_deleting_files"),
                t("home.settings.storage.clear_all_cache_error_desc"),
              );
            }
          },
        },
      ],
    );
  };

  const currentAudioTranscode =
    settings.audioTranscodeMode || AudioTranscodeMode.Auto;
  const currentInactivityTimeout =
    settings.inactivityTimeout ?? InactivityTimeout.Disabled;

  const audioTranscodeModeOptions: TVOptionItem<AudioTranscodeMode>[] = useMemo(
    () => [
      {
        label: t("home.settings.audio.transcode_mode.auto"),
        value: AudioTranscodeMode.Auto,
        selected: currentAudioTranscode === AudioTranscodeMode.Auto,
      },
      {
        label: t("home.settings.audio.transcode_mode.stereo"),
        value: AudioTranscodeMode.ForceStereo,
        selected: currentAudioTranscode === AudioTranscodeMode.ForceStereo,
      },
      {
        label: t("home.settings.audio.transcode_mode.5_1"),
        value: AudioTranscodeMode.Allow51,
        selected: currentAudioTranscode === AudioTranscodeMode.Allow51,
      },
      {
        label: t("home.settings.audio.transcode_mode.passthrough"),
        value: AudioTranscodeMode.AllowAll,
        selected: currentAudioTranscode === AudioTranscodeMode.AllowAll,
      },
    ],
    [t, currentAudioTranscode],
  );

  const inactivityTimeoutOptions: TVOptionItem<InactivityTimeout>[] = useMemo(
    () => [
      {
        label: t("home.settings.security.inactivity_timeout.disabled"),
        value: InactivityTimeout.Disabled,
        selected: currentInactivityTimeout === InactivityTimeout.Disabled,
      },
      {
        label: t("home.settings.security.inactivity_timeout.1_minute"),
        value: InactivityTimeout.OneMinute,
        selected: currentInactivityTimeout === InactivityTimeout.OneMinute,
      },
      {
        label: t("home.settings.security.inactivity_timeout.5_minutes"),
        value: InactivityTimeout.FiveMinutes,
        selected: currentInactivityTimeout === InactivityTimeout.FiveMinutes,
      },
      {
        label: t("home.settings.security.inactivity_timeout.15_minutes"),
        value: InactivityTimeout.FifteenMinutes,
        selected: currentInactivityTimeout === InactivityTimeout.FifteenMinutes,
      },
      {
        label: t("home.settings.security.inactivity_timeout.30_minutes"),
        value: InactivityTimeout.ThirtyMinutes,
        selected: currentInactivityTimeout === InactivityTimeout.ThirtyMinutes,
      },
      {
        label: t("home.settings.security.inactivity_timeout.1_hour"),
        value: InactivityTimeout.OneHour,
        selected: currentInactivityTimeout === InactivityTimeout.OneHour,
      },
      {
        label: t("home.settings.security.inactivity_timeout.4_hours"),
        value: InactivityTimeout.FourHours,
        selected: currentInactivityTimeout === InactivityTimeout.FourHours,
      },
      {
        label: t("home.settings.security.inactivity_timeout.24_hours"),
        value: InactivityTimeout.TwentyFourHours,
        selected:
          currentInactivityTimeout === InactivityTimeout.TwentyFourHours,
      },
    ],
    [t, currentInactivityTimeout],
  );

  const audioTranscodeLabel = useMemo(() => {
    const option = audioTranscodeModeOptions.find((o) => o.selected);
    return option?.label || t("home.settings.audio.transcode_mode.auto");
  }, [audioTranscodeModeOptions, t]);

  const inactivityTimeoutLabel = useMemo(() => {
    const option = inactivityTimeoutOptions.find((o) => o.selected);
    return (
      option?.label || t("home.settings.security.inactivity_timeout.disabled")
    );
  }, [inactivityTimeoutOptions, t]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + 120,
            paddingBottom: insets.bottom + 60,
            paddingHorizontal: insets.left + 80,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: typography.title,
              fontWeight: "bold",
              color: "#FFFFFF",
              marginBottom: 8,
            }}
          >
            {t("home.settings.settings_title")}
          </Text>

          <TVUserSwitchSection />

          <TVSectionHeader title={t("home.settings.security.title")} />
          <TVSettingsOptionButton
            label={t("home.settings.security.inactivity_timeout.title")}
            value={inactivityTimeoutLabel}
            onPress={() =>
              showOptions({
                title: t("home.settings.security.inactivity_timeout.title"),
                options: inactivityTimeoutOptions,
                onSelect: (value) =>
                  updateSettings({ inactivityTimeout: value }),
              })
            }
          />

          <TVSectionHeader title={t("home.settings.audio.audio_title")} />
          <TVSettingsOptionButton
            label={t("home.settings.audio.transcode_mode.title")}
            value={audioTranscodeLabel}
            onPress={() =>
              showOptions({
                title: t("home.settings.audio.transcode_mode.title"),
                options: audioTranscodeModeOptions,
                onSelect: (value) =>
                  updateSettings({ audioTranscodeMode: value }),
              })
            }
          />

          <TVSubtitlesSection />

          <TVBufferAndVideoSection />

          <TVAppearanceSection />

          <TVSectionHeader title={t("home.settings.storage.storage_title")} />
          <TVSettingsOptionButton
            label={t("home.settings.storage.clear_all_cache")}
            value=''
            onPress={handleClearCache}
            isFirst
          />

          <TVSectionHeader
            title={t("home.settings.user_info.user_info_title")}
          />
          <TVSettingsRow
            label={t("home.settings.user_info.user")}
            value={user?.Name || "-"}
            showChevron={false}
          />
          <TVSettingsRow
            label={t("home.settings.user_info.server")}
            value={api?.basePath || "-"}
            showChevron={false}
          />

          <View style={{ marginTop: 48, alignItems: "center" }}>
            <TVLogoutButton onPress={logout} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
