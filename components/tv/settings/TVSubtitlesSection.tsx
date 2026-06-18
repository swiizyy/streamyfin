import { SubtitlePlaybackMode } from "@jellyfin/sdk/lib/generated-client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/common/Text";
import type { TVOptionItem } from "@/components/tv";
import { useScaledTVTypography } from "@/constants/TVTypography";
import { useTVOptionModal } from "@/hooks/useTVOptionModal";
import { useSettings } from "@/utils/atoms/settings";
import { TVSectionHeader } from "./TVSectionHeader";
import { TVSettingsOptionButton } from "./TVSettingsOptionButton";
import { TVSettingsStepper } from "./TVSettingsStepper";
import { TVSettingsTextInput } from "./TVSettingsTextInput";
import { TVSettingsToggle } from "./TVSettingsToggle";

export const TVSubtitlesSection: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { showOptions } = useTVOptionModal();
  const typography = useScaledTVTypography();

  const [openSubtitlesApiKey, setOpenSubtitlesApiKey] = useState(
    settings.openSubtitlesApiKey || "",
  );

  const currentSubtitleMode =
    settings.subtitleMode || SubtitlePlaybackMode.Default;
  const currentAlignX = settings.mpvSubtitleAlignX ?? "center";
  const currentAlignY = settings.mpvSubtitleAlignY ?? "bottom";

  const subtitleModeOptions: TVOptionItem<SubtitlePlaybackMode>[] = useMemo(
    () => [
      {
        label: t("home.settings.subtitles.modes.Default"),
        value: SubtitlePlaybackMode.Default,
        selected: currentSubtitleMode === SubtitlePlaybackMode.Default,
      },
      {
        label: t("home.settings.subtitles.modes.Smart"),
        value: SubtitlePlaybackMode.Smart,
        selected: currentSubtitleMode === SubtitlePlaybackMode.Smart,
      },
      {
        label: t("home.settings.subtitles.modes.OnlyForced"),
        value: SubtitlePlaybackMode.OnlyForced,
        selected: currentSubtitleMode === SubtitlePlaybackMode.OnlyForced,
      },
      {
        label: t("home.settings.subtitles.modes.Always"),
        value: SubtitlePlaybackMode.Always,
        selected: currentSubtitleMode === SubtitlePlaybackMode.Always,
      },
      {
        label: t("home.settings.subtitles.modes.None"),
        value: SubtitlePlaybackMode.None,
        selected: currentSubtitleMode === SubtitlePlaybackMode.None,
      },
    ],
    [t, currentSubtitleMode],
  );

  const alignXOptions: TVOptionItem<string>[] = useMemo(
    () => [
      { label: "Left", value: "left", selected: currentAlignX === "left" },
      {
        label: "Center",
        value: "center",
        selected: currentAlignX === "center",
      },
      { label: "Right", value: "right", selected: currentAlignX === "right" },
    ],
    [currentAlignX],
  );

  const alignYOptions: TVOptionItem<string>[] = useMemo(
    () => [
      { label: "Top", value: "top", selected: currentAlignY === "top" },
      {
        label: "Center",
        value: "center",
        selected: currentAlignY === "center",
      },
      {
        label: "Bottom",
        value: "bottom",
        selected: currentAlignY === "bottom",
      },
    ],
    [currentAlignY],
  );

  const subtitleModeLabel = useMemo(() => {
    const option = subtitleModeOptions.find((o) => o.selected);
    return option?.label || t("home.settings.subtitles.modes.Default");
  }, [subtitleModeOptions, t]);

  const alignXLabel = useMemo(() => {
    const option = alignXOptions.find((o) => o.selected);
    return option?.label || "Center";
  }, [alignXOptions]);

  const alignYLabel = useMemo(() => {
    const option = alignYOptions.find((o) => o.selected);
    return option?.label || "Bottom";
  }, [alignYOptions]);

  return (
    <>
      <TVSectionHeader title={t("home.settings.subtitles.subtitle_title")} />
      <TVSettingsOptionButton
        label={t("home.settings.subtitles.subtitle_mode")}
        value={subtitleModeLabel}
        onPress={() =>
          showOptions({
            title: t("home.settings.subtitles.subtitle_mode"),
            options: subtitleModeOptions,
            onSelect: (value) => updateSettings({ subtitleMode: value }),
          })
        }
      />
      <TVSettingsToggle
        label={t("home.settings.subtitles.set_subtitle_track")}
        value={settings.rememberSubtitleSelections}
        onToggle={(value) =>
          updateSettings({ rememberSubtitleSelections: value })
        }
      />
      <TVSettingsStepper
        label={t("home.settings.subtitles.subtitle_size")}
        value={settings.mpvSubtitleScale ?? 1.0}
        onDecrease={() => {
          const newValue = Math.max(
            0.1,
            (settings.mpvSubtitleScale ?? 1.0) - 0.1,
          );
          updateSettings({
            mpvSubtitleScale: Math.round(newValue * 10) / 10,
          });
        }}
        onIncrease={() => {
          const newValue = Math.min(
            3.0,
            (settings.mpvSubtitleScale ?? 1.0) + 0.1,
          );
          updateSettings({
            mpvSubtitleScale: Math.round(newValue * 10) / 10,
          });
        }}
        formatValue={(v) => `${v.toFixed(1)}x`}
      />
      <TVSettingsStepper
        label='Vertical Margin'
        value={settings.mpvSubtitleMarginY ?? 0}
        onDecrease={() => {
          const newValue = Math.max(0, (settings.mpvSubtitleMarginY ?? 0) - 5);
          updateSettings({ mpvSubtitleMarginY: newValue });
        }}
        onIncrease={() => {
          const newValue = Math.min(
            100,
            (settings.mpvSubtitleMarginY ?? 0) + 5,
          );
          updateSettings({ mpvSubtitleMarginY: newValue });
        }}
      />
      <TVSettingsOptionButton
        label='Horizontal Alignment'
        value={alignXLabel}
        onPress={() =>
          showOptions({
            title: "Horizontal Alignment",
            options: alignXOptions,
            onSelect: (value) =>
              updateSettings({
                mpvSubtitleAlignX: value as "left" | "center" | "right",
              }),
          })
        }
      />
      <TVSettingsOptionButton
        label='Vertical Alignment'
        value={alignYLabel}
        onPress={() =>
          showOptions({
            title: "Vertical Alignment",
            options: alignYOptions,
            onSelect: (value) =>
              updateSettings({
                mpvSubtitleAlignY: value as "top" | "center" | "bottom",
              }),
          })
        }
      />

      <TVSectionHeader
        title={
          t("home.settings.subtitles.opensubtitles_title") || "OpenSubtitles"
        }
      />
      <Text
        style={{
          color: "#9CA3AF",
          fontSize: typography.callout - 2,
          marginBottom: 16,
          marginLeft: 8,
        }}
      >
        {t("home.settings.subtitles.opensubtitles_hint") ||
          "Enter your OpenSubtitles API key to enable client-side subtitle search as a fallback when your Jellyfin server doesn't have a subtitle provider configured."}
      </Text>
      <TVSettingsTextInput
        label={t("home.settings.subtitles.opensubtitles_api_key") || "API Key"}
        value={openSubtitlesApiKey}
        placeholder={
          t("home.settings.subtitles.opensubtitles_api_key_placeholder") ||
          "Enter API key..."
        }
        onChangeText={setOpenSubtitlesApiKey}
        onBlur={() => updateSettings({ openSubtitlesApiKey })}
        secureTextEntry
      />
      <Text
        style={{
          color: "#6B7280",
          fontSize: typography.callout - 4,
          marginTop: 8,
          marginLeft: 8,
        }}
      >
        {t("home.settings.subtitles.opensubtitles_get_key") ||
          "Get your free API key at opensubtitles.com/en/consumers"}
      </Text>
    </>
  );
};
