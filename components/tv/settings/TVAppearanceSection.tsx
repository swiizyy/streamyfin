import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TVOptionItem } from "@/components/tv";
import { useTVOptionModal } from "@/hooks/useTVOptionModal";
import { APP_LANGUAGES } from "@/i18n";
import { TVTypographyScale, useSettings } from "@/utils/atoms/settings";
import { TVSectionHeader } from "./TVSectionHeader";
import { TVSettingsOptionButton } from "./TVSettingsOptionButton";
import { TVSettingsToggle } from "./TVSettingsToggle";

export const TVAppearanceSection: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { showOptions } = useTVOptionModal();

  const currentTypographyScale =
    settings.tvTypographyScale || TVTypographyScale.Default;
  const currentLanguage = settings.preferedLanguage;

  const typographyScaleOptions: TVOptionItem<TVTypographyScale>[] = useMemo(
    () => [
      {
        label: t("home.settings.appearance.display_size_small"),
        value: TVTypographyScale.Small,
        selected: currentTypographyScale === TVTypographyScale.Small,
      },
      {
        label: t("home.settings.appearance.display_size_default"),
        value: TVTypographyScale.Default,
        selected: currentTypographyScale === TVTypographyScale.Default,
      },
      {
        label: t("home.settings.appearance.display_size_large"),
        value: TVTypographyScale.Large,
        selected: currentTypographyScale === TVTypographyScale.Large,
      },
      {
        label: t("home.settings.appearance.display_size_extra_large"),
        value: TVTypographyScale.ExtraLarge,
        selected: currentTypographyScale === TVTypographyScale.ExtraLarge,
      },
    ],
    [t, currentTypographyScale],
  );

  const languageOptions: TVOptionItem<string | undefined>[] = useMemo(
    () => [
      {
        label: t("home.settings.languages.system"),
        value: undefined,
        selected: !currentLanguage,
      },
      ...APP_LANGUAGES.map((lang) => ({
        label: lang.label,
        value: lang.value,
        selected: currentLanguage === lang.value,
      })),
    ],
    [t, currentLanguage],
  );

  const typographyScaleLabel = useMemo(() => {
    const option = typographyScaleOptions.find((o) => o.selected);
    return option?.label || t("home.settings.appearance.display_size_default");
  }, [typographyScaleOptions, t]);

  const languageLabel = useMemo(() => {
    if (!currentLanguage) return t("home.settings.languages.system");
    const option = APP_LANGUAGES.find((l) => l.value === currentLanguage);
    return option?.label || t("home.settings.languages.system");
  }, [currentLanguage, t]);

  return (
    <>
      <TVSectionHeader title={t("home.settings.appearance.title")} />
      <TVSettingsOptionButton
        label={t("home.settings.appearance.display_size")}
        value={typographyScaleLabel}
        onPress={() =>
          showOptions({
            title: t("home.settings.appearance.display_size"),
            options: typographyScaleOptions,
            onSelect: (value) => updateSettings({ tvTypographyScale: value }),
          })
        }
      />
      <TVSettingsOptionButton
        label={t("home.settings.languages.app_language")}
        value={languageLabel}
        onPress={() =>
          showOptions({
            title: t("home.settings.languages.app_language"),
            options: languageOptions,
            onSelect: (value) => updateSettings({ preferedLanguage: value }),
          })
        }
      />
      <TVSettingsToggle
        label={t("home.settings.appearance.merge_next_up_continue_watching")}
        value={settings.mergeNextUpAndContinueWatching}
        onToggle={(value) =>
          updateSettings({ mergeNextUpAndContinueWatching: value })
        }
      />
      <TVSettingsToggle
        label={t("home.settings.appearance.show_home_backdrop")}
        value={settings.showHomeBackdrop}
        onToggle={(value) => updateSettings({ showHomeBackdrop: value })}
      />
      <TVSettingsToggle
        label={t("home.settings.appearance.show_hero_carousel")}
        value={settings.showTVHeroCarousel}
        onToggle={(value) => updateSettings({ showTVHeroCarousel: value })}
      />
      <TVSettingsToggle
        label={t("home.settings.appearance.show_series_poster_on_episode")}
        value={settings.showSeriesPosterOnEpisode}
        onToggle={(value) =>
          updateSettings({ showSeriesPosterOnEpisode: value })
        }
      />
      <TVSettingsToggle
        label={t("home.settings.appearance.theme_music")}
        value={settings.tvThemeMusicEnabled}
        onToggle={(value) => updateSettings({ tvThemeMusicEnabled: value })}
      />
    </>
  );
};
