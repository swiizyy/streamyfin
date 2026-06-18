import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TVOptionItem } from "@/components/tv";
import { useTVOptionModal } from "@/hooks/useTVOptionModal";
import {
  type MpvCacheMode,
  type MpvVoDriver,
  useSettings,
} from "@/utils/atoms/settings";
import { TVSectionHeader } from "./TVSectionHeader";
import { TVSettingsOptionButton } from "./TVSettingsOptionButton";
import { TVSettingsStepper } from "./TVSettingsStepper";

export const TVBufferAndVideoSection: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { showOptions } = useTVOptionModal();

  const currentCacheMode = settings.mpvCacheEnabled ?? "auto";
  const currentVoDriver = settings.mpvVoDriver ?? "gpu-next";

  const cacheModeOptions: TVOptionItem<MpvCacheMode>[] = useMemo(
    () => [
      {
        label: t("home.settings.buffer.cache_auto"),
        value: "auto",
        selected: currentCacheMode === "auto",
      },
      {
        label: t("home.settings.buffer.cache_yes"),
        value: "yes",
        selected: currentCacheMode === "yes",
      },
      {
        label: t("home.settings.buffer.cache_no"),
        value: "no",
        selected: currentCacheMode === "no",
      },
    ],
    [t, currentCacheMode],
  );

  const voDriverOptions: TVOptionItem<MpvVoDriver>[] = useMemo(
    () => [
      {
        label: t("home.settings.vo_driver.gpu_next"),
        value: "gpu-next",
        selected: currentVoDriver === "gpu-next",
      },
      {
        label: t("home.settings.vo_driver.gpu"),
        value: "gpu",
        selected: currentVoDriver === "gpu",
      },
    ],
    [t, currentVoDriver],
  );

  const cacheModeLabel = useMemo(() => {
    const option = cacheModeOptions.find((o) => o.selected);
    return option?.label || t("home.settings.buffer.cache_auto");
  }, [cacheModeOptions, t]);

  const voDriverLabel = useMemo(() => {
    const option = voDriverOptions.find((o) => o.selected);
    return option?.label || t("home.settings.vo_driver.gpu_next");
  }, [voDriverOptions, t]);

  return (
    <>
      <TVSectionHeader title={t("home.settings.buffer.title")} />
      <TVSettingsOptionButton
        label={t("home.settings.buffer.cache_mode")}
        value={cacheModeLabel}
        onPress={() =>
          showOptions({
            title: t("home.settings.buffer.cache_mode"),
            options: cacheModeOptions,
            onSelect: (value) => updateSettings({ mpvCacheEnabled: value }),
          })
        }
      />

      <TVSectionHeader title={t("home.settings.vo_driver.title")} />
      <TVSettingsOptionButton
        label={t("home.settings.vo_driver.vo_mode")}
        value={voDriverLabel}
        onPress={() =>
          showOptions({
            title: t("home.settings.vo_driver.vo_mode"),
            options: voDriverOptions,
            onSelect: (value) => updateSettings({ mpvVoDriver: value }),
          })
        }
      />
      <TVSettingsStepper
        label={t("home.settings.buffer.buffer_duration")}
        value={settings.mpvCacheSeconds ?? 10}
        onDecrease={() => {
          const newValue = Math.max(5, (settings.mpvCacheSeconds ?? 10) - 5);
          updateSettings({ mpvCacheSeconds: newValue });
        }}
        onIncrease={() => {
          const newValue = Math.min(120, (settings.mpvCacheSeconds ?? 10) + 5);
          updateSettings({ mpvCacheSeconds: newValue });
        }}
        formatValue={(v) => `${v}s`}
      />
      <TVSettingsStepper
        label={t("home.settings.buffer.max_cache_size")}
        value={settings.mpvDemuxerMaxBytes ?? 150}
        onDecrease={() => {
          const newValue = Math.max(
            50,
            (settings.mpvDemuxerMaxBytes ?? 150) - 25,
          );
          updateSettings({ mpvDemuxerMaxBytes: newValue });
        }}
        onIncrease={() => {
          const newValue = Math.min(
            500,
            (settings.mpvDemuxerMaxBytes ?? 150) + 25,
          );
          updateSettings({ mpvDemuxerMaxBytes: newValue });
        }}
        formatValue={(v) => `${v} MB`}
      />
      <TVSettingsStepper
        label={t("home.settings.buffer.max_backward_cache")}
        value={settings.mpvDemuxerMaxBackBytes ?? 50}
        onDecrease={() => {
          const newValue = Math.max(
            25,
            (settings.mpvDemuxerMaxBackBytes ?? 50) - 25,
          );
          updateSettings({ mpvDemuxerMaxBackBytes: newValue });
        }}
        onIncrease={() => {
          const newValue = Math.min(
            200,
            (settings.mpvDemuxerMaxBackBytes ?? 50) + 25,
          );
          updateSettings({ mpvDemuxerMaxBackBytes: newValue });
        }}
        formatValue={(v) => `${v} MB`}
      />
    </>
  );
};
