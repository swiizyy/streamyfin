import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Image } from "expo-image";
import { useAtom } from "jotai";
import { View } from "react-native";
import { Text } from "@/components/common/Text";
import { TouchableItemRouter } from "@/components/common/TouchableItemRouter";
import { apiAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";

export type MusicSearchItemVariant = "artist" | "album" | "song" | "playlist";

interface MusicSearchItemProps {
  item: BaseItemDto;
  variant: MusicSearchItemVariant;
}

export const MusicSearchItem: React.FC<MusicSearchItemProps> = ({
  item,
  variant,
}) => {
  const [api] = useAtom(apiAtom);
  const imageUrl = getPrimaryImageUrl({ api, item });

  if (variant === "artist") {
    return (
      <TouchableItemRouter
        item={item}
        key={item.Id}
        className='flex flex-col w-24 mr-2 items-center'
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: "hidden",
            backgroundColor: "#1a1a1a",
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit='cover'
            />
          ) : (
            <View className='flex-1 items-center justify-center bg-neutral-800'>
              <Text className='text-xl'>👤</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} className='mt-2 text-center'>
          {item.Name}
        </Text>
      </TouchableItemRouter>
    );
  }

  const emoji = variant === "playlist" ? "🎶" : "🎵";
  const subtitle =
    variant === "album"
      ? item.AlbumArtist || item.Artists?.join(", ")
      : variant === "song"
        ? item.Artists?.join(", ") || item.AlbumArtist
        : `${item.ChildCount} tracks`;

  return (
    <TouchableItemRouter
      item={item}
      key={item.Id}
      className='flex flex-col w-28 mr-2'
    >
      <View
        style={{
          width: 112,
          height: 112,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "#1a1a1a",
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit='cover'
          />
        ) : (
          <View className='flex-1 items-center justify-center bg-neutral-800'>
            <Text className='text-4xl'>{emoji}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} className='mt-2'>
        {item.Name}
      </Text>
      <Text className='opacity-50 text-xs' numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableItemRouter>
  );
};
