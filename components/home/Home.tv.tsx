import type {
  BaseItemDto,
  BaseItemDtoQueryResult,
  BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client/models";
import {
  getItemsApi,
  getSuggestionsApi,
  getTvShowsApi,
  getUserLibraryApi,
  getUserViewsApi,
} from "@jellyfin/sdk/lib/utils/api";
import { type QueryFunction, useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfiniteScrollingCollectionList } from "@/components/home/InfiniteScrollingCollectionList.tv";
import { StreamystatsPromotedWatchlists } from "@/components/home/StreamystatsPromotedWatchlists.tv";
import { StreamystatsRecommendations } from "@/components/home/StreamystatsRecommendations.tv";
import { TVDynamicBackdrop } from "@/components/home/TVDynamicBackdrop";
import { TVHeroCarousel } from "@/components/home/TVHeroCarousel";
import { TVNetworkErrorView } from "@/components/home/TVNetworkErrorView";
import { TVQueryErrorView } from "@/components/home/TVQueryErrorView";
import { Loader } from "@/components/Loader";
import useRouter from "@/hooks/useAppRouter";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useRefreshLibraryOnFocus } from "@/hooks/useRefreshLibraryOnFocus";
import { useInvalidatePlaybackProgressCache } from "@/hooks/useRevalidatePlaybackProgressCache";
import { useTVItemActionModal } from "@/hooks/useTVItemActionModal";
import {
  apiAtom,
  cacheVersionAtom,
  userAtom,
} from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getBackdropUrl } from "@/utils/jellyfin/image/getBackdropUrl";
import { scaleSize } from "@/utils/scaleSize";
import { updateTVDiscovery } from "@/utils/tvDiscovery/sync";

const TOP_PADDING = scaleSize(100);
// Generous gap between sections for Apple TV+ aesthetic
const SECTION_GAP = scaleSize(24);

type InfiniteScrollingCollectionListSection = {
  type: "InfiniteScrollingCollectionList";
  title?: string;
  queryKey: (string | undefined | null)[];
  queryFn: QueryFunction<BaseItemDto[], any, number>;
  orientation?: "horizontal" | "vertical";
  pageSize?: number;
  parentId?: string;
};

type Section = InfiniteScrollingCollectionListSection;

// Debounce delay in ms - prevents rapid backdrop changes when scrolling fast
const BACKDROP_DEBOUNCE_MS = 300;

export const Home = () => {
  const _router = useRouter();
  const { t } = useTranslation();
  const api = useAtomValue(apiAtom);
  const user = useAtomValue(userAtom);
  const cacheVersion = useAtomValue(cacheVersionAtom);
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const {
    isConnected,
    serverConnected,
    loading: retryLoading,
    retryCheck,
  } = useNetworkStatus();
  const _invalidateCache = useInvalidatePlaybackProgressCache();
  const { showItemActions } = useTVItemActionModal();

  // Fallback refresh for newly added content when returning to the home screen
  // (primary path is the LibraryChanged WebSocket event).
  useRefreshLibraryOnFocus();

  // Dynamic backdrop state with debounce
  const [focusedItem, setFocusedItem] = useState<BaseItemDto | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle item focus with debounce
  const handleItemFocus = useCallback((item: BaseItemDto) => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Set new timer to update focused item after debounce delay
    debounceTimerRef.current = setTimeout(() => {
      setFocusedItem(item);
    }, BACKDROP_DEBOUNCE_MS);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Get backdrop URL from focused item (only if setting is enabled)
  const backdropUrl = useMemo(() => {
    if (!settings.showHomeBackdrop || !focusedItem) return null;
    return getBackdropUrl({
      api,
      item: focusedItem,
      quality: 90,
      width: 1920,
    });
  }, [api, focusedItem, settings.showHomeBackdrop]);

  // Crossfade animation for backdrop transitions
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);
  const [layer0Url, setLayer0Url] = useState<string | null>(null);
  const [layer1Url, setLayer1Url] = useState<string | null>(null);
  const layer0Opacity = useRef(new Animated.Value(0)).current;
  const layer1Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!backdropUrl) return;

    let isCancelled = false;

    const performCrossfade = async () => {
      // Prefetch the image before starting the crossfade
      try {
        await Image.prefetch(backdropUrl);
      } catch {
        // Continue even if prefetch fails
      }

      if (isCancelled) return;

      // Determine which layer to fade in
      const incomingLayer = activeLayer === 0 ? 1 : 0;
      const incomingOpacity =
        incomingLayer === 0 ? layer0Opacity : layer1Opacity;
      const outgoingOpacity =
        incomingLayer === 0 ? layer1Opacity : layer0Opacity;

      // Set the new URL on the incoming layer
      if (incomingLayer === 0) {
        setLayer0Url(backdropUrl);
      } else {
        setLayer1Url(backdropUrl);
      }

      // Small delay to ensure image component has the new URL
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (isCancelled) return;

      // Crossfade: fade in the incoming layer, fade out the outgoing
      Animated.parallel([
        Animated.timing(incomingOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(outgoingOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isCancelled) {
          setActiveLayer(incomingLayer);
        }
      });
    };

    performCrossfade();

    return () => {
      isCancelled = true;
    };
  }, [backdropUrl]);

  const {
    data,
    isError: e1,
    isLoading: l1,
  } = useQuery({
    queryKey: ["home", "userViews", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) {
        return null;
      }

      const response = await getUserViewsApi(api).getUserViews({
        userId: user.Id,
      });

      return response.data.Items || null;
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Fetch hero items (Continue Watching + Next Up combined)
  const { data: heroItems } = useQuery({
    queryKey: ["home", "heroItems", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) return [];

      const [resumeResponse, nextUpResponse] = await Promise.all([
        getItemsApi(api).getResumeItems({
          userId: user.Id,
          enableImageTypes: ["Primary", "Backdrop", "Thumb"],
          includeItemTypes: ["Movie", "Series", "Episode"],
          fields: ["Overview"],
          startIndex: 0,
          limit: 10,
        }),
        getTvShowsApi(api).getNextUp({
          userId: user.Id,
          startIndex: 0,
          limit: 10,
          fields: ["Overview"],
          enableImageTypes: ["Primary", "Backdrop", "Thumb"],
          enableResumable: false,
        }),
      ]);

      const resumeItems = resumeResponse.data.Items || [];
      const nextUpItems = nextUpResponse.data.Items || [];

      // Combine, sort by recent activity, and dedupe
      const combined = [...resumeItems, ...nextUpItems];
      const sorted = combined.sort((a, b) => {
        const dateA = a.UserData?.LastPlayedDate || a.DateCreated || "";
        const dateB = b.UserData?.LastPlayedDate || b.DateCreated || "";
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      const seen = new Set<string>();
      const deduped: BaseItemDto[] = [];
      for (const item of sorted) {
        if (!item.Id || seen.has(item.Id)) continue;
        seen.add(item.Id);
        deduped.push(item);
      }

      return deduped.slice(0, 15);
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    updateTVDiscovery({
      api,
      sections: [
        {
          title: t("home.continue_and_next_up"),
          items: heroItems,
        },
      ],
    });
  }, [api, heroItems, t]);

  const userViews = useMemo(
    () => data?.filter((l) => !settings?.hiddenLibraries?.includes(l.Id!)),
    [data, settings?.hiddenLibraries],
  );

  const collections = useMemo(() => {
    const allow = ["movies", "tvshows"];
    return (
      userViews?.filter(
        (c) => c.CollectionType && allow.includes(c.CollectionType),
      ) || []
    );
  }, [userViews]);

  const createCollectionConfig = useCallback(
    (
      title: string,
      queryKey: string[],
      includeItemTypes: BaseItemKind[],
      parentId: string | undefined,
      pageSize = 10,
    ): InfiniteScrollingCollectionListSection => ({
      title,
      queryKey,
      queryFn: async ({ pageParam = 0 }) => {
        if (!api) return [];
        const allData =
          (
            await getUserLibraryApi(api).getLatestMedia({
              userId: user?.Id,
              limit: 10,
              fields: ["PrimaryImageAspectRatio"],
              imageTypeLimit: 1,
              enableImageTypes: ["Primary", "Backdrop", "Thumb"],
              includeItemTypes,
              parentId,
            })
          ).data || [];

        return allData.slice(pageParam, pageParam + pageSize);
      },
      type: "InfiniteScrollingCollectionList",
      pageSize,
      parentId,
    }),
    [api, user?.Id],
  );

  const defaultSections = useMemo(() => {
    if (!api || !user?.Id) return [];

    const latestMediaViews = collections.map((c) => {
      const includeItemTypes: BaseItemKind[] =
        c.CollectionType === "tvshows" || c.CollectionType === "movies"
          ? []
          : ["Movie"];
      const title = t("home.recently_added_in", { libraryName: c.Name });
      const queryKey: string[] = [
        "home",
        `recentlyAddedIn${c.CollectionType}`,
        user.Id!,
        c.Id!,
      ];
      return createCollectionConfig(
        title || "",
        queryKey,
        includeItemTypes,
        c.Id,
        10,
      );
    });

    const sortByRecentActivity = (items: BaseItemDto[]): BaseItemDto[] => {
      return items.sort((a, b) => {
        const dateA = a.UserData?.LastPlayedDate || a.DateCreated || "";
        const dateB = b.UserData?.LastPlayedDate || b.DateCreated || "";
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    };

    const deduplicateById = (items: BaseItemDto[]): BaseItemDto[] => {
      const seen = new Set<string>();
      return items.filter((item) => {
        if (!item.Id || seen.has(item.Id)) return false;
        seen.add(item.Id);
        return true;
      });
    };

    const firstSections: Section[] = settings.mergeNextUpAndContinueWatching
      ? [
          {
            title: t("home.continue_and_next_up"),
            queryKey: ["home", "continueAndNextUp"],
            queryFn: async ({ pageParam = 0 }) => {
              const [resumeResponse, nextUpResponse] = await Promise.all([
                getItemsApi(api).getResumeItems({
                  userId: user.Id,
                  enableImageTypes: ["Primary", "Backdrop", "Thumb"],
                  includeItemTypes: ["Movie", "Series", "Episode"],
                  startIndex: 0,
                  limit: 20,
                }),
                getTvShowsApi(api).getNextUp({
                  userId: user?.Id,
                  startIndex: 0,
                  limit: 20,
                  enableImageTypes: ["Primary", "Backdrop", "Thumb"],
                  enableResumable: false,
                }),
              ]);

              const resumeItems = resumeResponse.data.Items || [];
              const nextUpItems = nextUpResponse.data.Items || [];

              const combined = [...resumeItems, ...nextUpItems];
              const sorted = sortByRecentActivity(combined);
              const deduplicated = deduplicateById(sorted);

              return deduplicated.slice(pageParam, pageParam + 10);
            },
            type: "InfiniteScrollingCollectionList",
            orientation: "horizontal",
            pageSize: 10,
          },
        ]
      : [
          {
            title: t("home.continue_watching"),
            queryKey: ["home", "resumeItems"],
            queryFn: async ({ pageParam = 0 }) =>
              (
                await getItemsApi(api).getResumeItems({
                  userId: user.Id,
                  enableImageTypes: ["Primary", "Backdrop", "Thumb"],
                  includeItemTypes: ["Movie", "Series", "Episode"],
                  startIndex: pageParam,
                  limit: 10,
                })
              ).data.Items || [],
            type: "InfiniteScrollingCollectionList",
            orientation: "horizontal",
            pageSize: 10,
          },
          {
            title: t("home.next_up"),
            queryKey: ["home", "nextUp-all"],
            queryFn: async ({ pageParam = 0 }) =>
              (
                await getTvShowsApi(api).getNextUp({
                  userId: user?.Id,
                  startIndex: pageParam,
                  limit: 10,
                  enableImageTypes: ["Primary", "Backdrop", "Thumb"],
                  enableResumable: false,
                })
              ).data.Items || [],
            type: "InfiniteScrollingCollectionList",
            orientation: "horizontal",
            pageSize: 10,
          },
        ];

    const ss: Section[] = [
      ...firstSections,
      ...latestMediaViews,
      ...(!settings?.streamyStatsMovieRecommendations
        ? [
            {
              title: t("home.suggested_movies"),
              queryKey: ["home", "suggestedMovies", user?.Id],
              queryFn: async ({ pageParam = 0 }: { pageParam?: number }) =>
                (
                  await getSuggestionsApi(api).getSuggestions({
                    userId: user?.Id,
                    startIndex: pageParam,
                    limit: 10,
                    mediaType: ["Video"],
                    type: ["Movie"],
                  })
                ).data.Items || [],
              type: "InfiniteScrollingCollectionList" as const,
              orientation: "vertical" as const,
              pageSize: 10,
            },
          ]
        : []),
    ];
    return ss;
  }, [
    api,
    user?.Id,
    collections,
    t,
    createCollectionConfig,
    settings?.streamyStatsMovieRecommendations,
    settings.mergeNextUpAndContinueWatching,
  ]);

  const customSections = useMemo(() => {
    if (!api || !user?.Id || !settings?.home?.sections) return [];
    const ss: Section[] = [];
    settings.home.sections.forEach((section, index) => {
      const id = section.title || `section-${index}`;
      const pageSize = 10;
      ss.push({
        title: t(`${id}`),
        queryKey: ["home", "custom", String(index), section.title ?? null],
        queryFn: async ({ pageParam = 0 }) => {
          if (section.items) {
            const response = await getItemsApi(api).getItems({
              userId: user?.Id,
              startIndex: pageParam,
              limit: section.items?.limit || pageSize,
              recursive: true,
              includeItemTypes: section.items?.includeItemTypes,
              sortBy: section.items?.sortBy,
              sortOrder: section.items?.sortOrder,
              filters: section.items?.filters,
              parentId: section.items?.parentId,
            });
            return response.data.Items || [];
          }
          if (section.nextUp) {
            const response = await getTvShowsApi(api).getNextUp({
              userId: user?.Id,
              startIndex: pageParam,
              limit: section.nextUp?.limit || pageSize,
              enableImageTypes: ["Primary", "Backdrop", "Thumb"],
              enableResumable: section.nextUp?.enableResumable,
              enableRewatching: section.nextUp?.enableRewatching,
            });
            return response.data.Items || [];
          }
          if (section.latest) {
            const allData =
              (
                await getUserLibraryApi(api).getLatestMedia({
                  userId: user?.Id,
                  includeItemTypes: section.latest?.includeItemTypes,
                  limit: section.latest?.limit || 10,
                  isPlayed: section.latest?.isPlayed,
                  groupItems: section.latest?.groupItems,
                })
              ).data || [];

            return allData.slice(pageParam, pageParam + pageSize);
          }
          if (section.custom) {
            const response = await api.get<BaseItemDtoQueryResult>(
              section.custom.endpoint,
              {
                params: {
                  ...(section.custom.query || {}),
                  userId: user?.Id,
                  startIndex: pageParam,
                  limit: pageSize,
                },
                headers: section.custom.headers || {},
              },
            );
            return response.data.Items || [];
          }
          return [];
        },
        type: "InfiniteScrollingCollectionList",
        orientation: section?.orientation || "vertical",
        pageSize,
      });
    });
    return ss;
  }, [api, user?.Id, settings?.home?.sections, t]);

  const sections = settings?.home?.sections ? customSections : defaultSections;

  // Determine if hero should be shown (separate setting from backdrop)
  // We need this early to calculate which sections will actually be rendered
  const showHero = useMemo(() => {
    return heroItems && heroItems.length > 0 && settings.showTVHeroCarousel;
  }, [heroItems, settings.showTVHeroCarousel]);

  // Get sections that will actually be rendered (accounting for hero slicing)
  // When hero is shown, skip the first sections since hero already displays that content
  // - If mergeNextUpAndContinueWatching: skip 1 section (combined Continue & Next Up)
  // - Otherwise: skip 2 sections (separate Continue Watching + Next Up)
  const renderedSections = useMemo(() => {
    if (!showHero) return sections;
    const sectionsToSkip = settings.mergeNextUpAndContinueWatching ? 1 : 2;
    return sections.slice(sectionsToSkip);
  }, [sections, showHero, settings.mergeNextUpAndContinueWatching]);

  if (!isConnected || serverConnected !== true) {
    return (
      <TVNetworkErrorView
        isConnected={isConnected}
        serverConnected={serverConnected}
        retryLoading={retryLoading}
        onRetry={retryCheck}
      />
    );
  }

  if (e1) return <TVQueryErrorView />;

  if (l1)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Loader />
      </View>
    );

  return (
    <View key={cacheVersion} style={{ flex: 1, backgroundColor: "#000000" }}>
      {!showHero && settings.showHomeBackdrop && (
        <TVDynamicBackdrop
          layer0Url={layer0Url}
          layer1Url={layer1Url}
          layer0Opacity={layer0Opacity}
          layer1Opacity={layer1Opacity}
        />
      )}

      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: showHero ? 0 : insets.top + TOP_PADDING,
          paddingBottom: insets.bottom + 60,
        }}
      >
        {/* Hero Carousel - Apple TV+ style featured content */}
        {showHero && heroItems && (
          <TVHeroCarousel
            items={heroItems}
            onItemFocus={handleItemFocus}
            onItemLongPress={showItemActions}
          />
        )}

        <View
          style={{
            gap: SECTION_GAP,
            paddingTop: showHero ? SECTION_GAP : 0,
          }}
        >
          {/* Skip first section (Continue Watching) when hero is shown since hero displays that content */}
          {renderedSections.map((section, index) => {
            // Render Streamystats sections after Recently Added sections
            // For default sections: place after Recently Added, before Suggested Movies (if present)
            // For custom sections: place at the very end
            const hasSuggestedMovies =
              !settings?.streamyStatsMovieRecommendations &&
              !settings?.home?.sections;
            const displayedSectionsLength = renderedSections.length;
            const streamystatsIndex =
              displayedSectionsLength - 1 - (hasSuggestedMovies ? 1 : 0);
            const hasStreamystatsContent =
              settings.streamyStatsMovieRecommendations ||
              settings.streamyStatsSeriesRecommendations ||
              settings.streamyStatsPromotedWatchlists;
            const streamystatsSections =
              index === streamystatsIndex && hasStreamystatsContent ? (
                <View key='streamystats-sections' style={{ gap: SECTION_GAP }}>
                  {settings.streamyStatsMovieRecommendations && (
                    <StreamystatsRecommendations
                      title={t(
                        "home.settings.plugins.streamystats.recommended_movies",
                      )}
                      type='Movie'
                      onItemFocus={handleItemFocus}
                    />
                  )}
                  {settings.streamyStatsSeriesRecommendations && (
                    <StreamystatsRecommendations
                      title={t(
                        "home.settings.plugins.streamystats.recommended_series",
                      )}
                      type='Series'
                      onItemFocus={handleItemFocus}
                    />
                  )}
                  {settings.streamyStatsPromotedWatchlists && (
                    <StreamystatsPromotedWatchlists
                      onItemFocus={handleItemFocus}
                    />
                  )}
                </View>
              ) : null;

            if (section.type === "InfiniteScrollingCollectionList") {
              // First section only gets preferred focus if hero is not shown
              const isFirstSection = index === 0 && !showHero;
              return (
                <View key={index} style={{ gap: SECTION_GAP }}>
                  <InfiniteScrollingCollectionList
                    title={section.title}
                    queryKey={section.queryKey}
                    queryFn={section.queryFn}
                    orientation={section.orientation}
                    hideIfEmpty
                    pageSize={section.pageSize}
                    isFirstSection={isFirstSection}
                    onItemFocus={handleItemFocus}
                    parentId={section.parentId}
                  />
                  {streamystatsSections}
                </View>
              );
            }
            return null;
          })}
        </View>
      </ScrollView>
    </View>
  );
};
