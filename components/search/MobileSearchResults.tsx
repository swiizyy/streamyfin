import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContinueWatchingPoster from "@/components/ContinueWatchingPoster";
import { Text } from "@/components/common/Text";
import { TouchableItemRouter } from "@/components/common/TouchableItemRouter";
import { ItemCardText } from "@/components/ItemCardText";
import {
  type JellyseerrSearchSort,
  JellyserrIndexPage,
} from "@/components/jellyseerr/JellyseerrIndexPage";
import MoviePoster from "@/components/posters/MoviePoster";
import SeriesPoster from "@/components/posters/SeriesPoster";
import { DiscoverFilters } from "@/components/search/DiscoverFilters";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import { MusicSearchItem } from "@/components/search/MusicSearchItem";
import { SearchItemWrapper } from "@/components/search/SearchItemWrapper";
import { SearchTabButtons } from "@/components/search/SearchTabButtons";

export type SearchType = "Library" | "Discover";

export type HeaderSearchBarRef = {
  focus: () => void;
  blur: () => void;
  setText: (text: string) => void;
  clearText: () => void;
  cancelSearch: () => void;
};

const exampleSearches = [
  "Lord of the rings",
  "Avengers",
  "Game of Thrones",
  "Breaking Bad",
  "Stranger Things",
  "The Mandalorian",
];

interface MobileSearchResultsProps {
  movies?: BaseItemDto[];
  series?: BaseItemDto[];
  episodes?: BaseItemDto[];
  collections?: BaseItemDto[];
  actors?: BaseItemDto[];
  artists?: BaseItemDto[];
  albums?: BaseItemDto[];
  songs?: BaseItemDto[];
  playlists?: BaseItemDto[];
  loading: boolean;
  l1: boolean;
  l2: boolean;
  debouncedSearch: string;
  noResults: boolean;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  showDiscover: boolean;
  jellyseerrOrderBy: JellyseerrSearchSort;
  setJellyseerrOrderBy: (v: JellyseerrSearchSort) => void;
  jellyseerrSortOrder: "asc" | "desc";
  setJellyseerrSortOrder: (v: "asc" | "desc") => void;
  searchFilterId: string;
  orderFilterId: string;
  setSearch: (s: string) => void;
  searchBarRef: React.RefObject<HeaderSearchBarRef | null>;
}

export const MobileSearchResults: React.FC<MobileSearchResultsProps> = ({
  movies,
  series,
  episodes,
  collections,
  actors,
  artists,
  albums,
  songs,
  playlists,
  loading,
  l1,
  l2,
  debouncedSearch,
  noResults,
  searchType,
  setSearchType,
  showDiscover,
  jellyseerrOrderBy,
  setJellyseerrOrderBy,
  jellyseerrSortOrder,
  setJellyseerrSortOrder,
  searchFilterId,
  orderFilterId,
  setSearch,
  searchBarRef,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardDismissMode='on-drag'
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 60,
      }}
    >
      <View
        className='flex flex-col'
        style={{ paddingTop: Platform.OS === "android" ? 10 : 0 }}
      >
        {showDiscover && (
          <View className='pl-4 pr-4 flex flex-row'>
            <SearchTabButtons
              searchType={searchType}
              setSearchType={setSearchType}
              t={t}
            />
            {searchType === "Discover" &&
              !loading &&
              noResults &&
              debouncedSearch.length > 0 && (
                <DiscoverFilters
                  searchFilterId={searchFilterId}
                  orderFilterId={orderFilterId}
                  jellyseerrOrderBy={jellyseerrOrderBy}
                  setJellyseerrOrderBy={setJellyseerrOrderBy}
                  jellyseerrSortOrder={jellyseerrSortOrder}
                  setJellyseerrSortOrder={setJellyseerrSortOrder}
                  t={t}
                />
              )}
          </View>
        )}

        <View className='mt-2'>
          <LoadingSkeleton isLoading={loading} />
        </View>

        {searchType === "Library" ? (
          <View className={l1 || l2 ? "opacity-0" : "opacity-100"}>
            <SearchItemWrapper
              header={t("search.movies")}
              items={movies}
              renderItem={(item: BaseItemDto) => (
                <TouchableItemRouter
                  key={item.Id}
                  className='flex flex-col w-28 mr-2'
                  item={item}
                >
                  <MoviePoster item={item} key={item.Id} />
                  <Text numberOfLines={2} className='mt-2'>
                    {item.Name}
                  </Text>
                  <Text className='opacity-50 text-xs'>
                    {item.ProductionYear}
                  </Text>
                </TouchableItemRouter>
              )}
            />
            <SearchItemWrapper
              items={series}
              header={t("search.series")}
              renderItem={(item: BaseItemDto) => (
                <TouchableItemRouter
                  key={item.Id}
                  item={item}
                  className='flex flex-col w-28 mr-2'
                >
                  <SeriesPoster item={item} key={item.Id} />
                  <Text numberOfLines={2} className='mt-2'>
                    {item.Name}
                  </Text>
                  <Text className='opacity-50 text-xs'>
                    {item.ProductionYear}
                  </Text>
                </TouchableItemRouter>
              )}
            />
            <SearchItemWrapper
              items={episodes}
              header={t("search.episodes")}
              renderItem={(item: BaseItemDto) => (
                <TouchableItemRouter
                  item={item}
                  key={item.Id}
                  className='flex flex-col w-44 mr-2'
                >
                  <ContinueWatchingPoster item={item} />
                  <ItemCardText item={item} />
                </TouchableItemRouter>
              )}
            />
            <SearchItemWrapper
              items={collections}
              header={t("search.collections")}
              renderItem={(item: BaseItemDto) => (
                <TouchableItemRouter
                  key={item.Id}
                  item={item}
                  className='flex flex-col w-28 mr-2'
                >
                  <MoviePoster item={item} key={item.Id} />
                  <Text numberOfLines={2} className='mt-2'>
                    {item.Name}
                  </Text>
                </TouchableItemRouter>
              )}
            />
            <SearchItemWrapper
              items={actors}
              header={t("search.actors")}
              renderItem={(item: BaseItemDto) => (
                <TouchableItemRouter
                  item={item}
                  key={item.Id}
                  className='flex flex-col w-28 mr-2'
                >
                  <MoviePoster item={item} />
                  <ItemCardText item={item} />
                </TouchableItemRouter>
              )}
            />
            <SearchItemWrapper
              items={artists}
              header={t("search.artists")}
              renderItem={(item: BaseItemDto) => (
                <MusicSearchItem item={item} variant='artist' />
              )}
            />
            <SearchItemWrapper
              items={albums}
              header={t("search.albums")}
              renderItem={(item: BaseItemDto) => (
                <MusicSearchItem item={item} variant='album' />
              )}
            />
            <SearchItemWrapper
              items={songs}
              header={t("search.songs")}
              renderItem={(item: BaseItemDto) => (
                <MusicSearchItem item={item} variant='song' />
              )}
            />
            <SearchItemWrapper
              items={playlists}
              header={t("search.playlists")}
              renderItem={(item: BaseItemDto) => (
                <MusicSearchItem item={item} variant='playlist' />
              )}
            />
          </View>
        ) : (
          <JellyserrIndexPage
            searchQuery={debouncedSearch}
            sortType={jellyseerrOrderBy}
            order={jellyseerrSortOrder}
          />
        )}

        {searchType === "Library" &&
          (!loading && noResults && debouncedSearch.length > 0 ? (
            <View>
              <Text className='text-center text-lg font-bold mt-4'>
                {t("search.no_results_found_for")}
              </Text>
              <Text className='text-xs text-purple-600 text-center'>
                "{debouncedSearch}"
              </Text>
            </View>
          ) : debouncedSearch.length === 0 ? (
            <View className='mt-2 flex flex-col items-center space-y-2'>
              {exampleSearches.map((e) => (
                <TouchableOpacity
                  onPress={() => {
                    setSearch(e);
                    searchBarRef.current?.setText(e);
                  }}
                  key={e}
                  className='mb-2'
                >
                  <Text className='text-purple-600'>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null)}
      </View>
    </ScrollView>
  );
};
