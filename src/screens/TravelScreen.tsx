import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AssetlibDynamicImage } from '@assetlib/sdk-expo';
import type { DynamicAssetRef } from '@assetlib/sdk-core';
import { AppBar, PageHeader, Segmented, StatusPill, roam as theme, type, useDemo } from '../components/Lab';
import { APP_APPEARANCE, ManagedArtwork, useAssetConnection } from '../assetlib/Connection';
import { usePublishedAssets } from '../assetlib/usePublishedAssets';
import { AppAssets } from '../assets.generated';

const places = [
  { id: 'cove', title: 'The quiet coast', location: 'Sea air · slow mornings', image: require('../../assets/coast-hero.png'), description: 'A little house above the water. A long breakfast. Nowhere in particular to be.', itinerary: ['A morning walk along the water', 'Lunch in the old harbor', 'One more chapter in the afternoon sun'] },
  { id: 'ridge', title: 'A path through the pines', location: 'Green hills · fresh air', image: require('../../assets/ridge-card.png'), description: 'Follow the winding path, find a sunny spot, and make a whole afternoon of it.', itinerary: ['A gentle climb through the trees', 'A picnic with a view', 'The long, lovely way back'] },
];
type TravelRow = { kind: 'sample'; id: string; place: typeof places[number] } | { kind: 'published'; id: string; asset: DynamicAssetRef };
const placeholder = require('../../assets/destination-placeholder.png');
const viewabilityConfig = { itemVisiblePercentThreshold: 1 };

function SaveButton({ saved, name, onPress }: { saved: boolean; name: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${name}`} accessibilityState={{ selected: saved }} aria-pressed={saved} onPress={onPress} style={({ pressed }) => [styles.save, saved && styles.saveActive, pressed && styles.pressed]}>
    <Feather name="heart" size={17} color={saved ? theme.onFill : theme.ink} />
  </Pressable>;
}

export default function TravelScreen() {
  const { saved, toggleSaved } = useDemo();
  const { client, revision } = useAssetConnection();
  const published = usePublishedAssets();
  const [filter, setFilter] = useState<'explore' | 'saved'>('explore');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewable, setViewable] = useState<Set<string>>(new Set());
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<TravelRow>[] }) => {
    setViewable(new Set(viewableItems.filter(item => item.isViewable).map(item => item.item.id)));
  }, []);
  const rows: TravelRow[] = [
    ...places.map(place => ({ kind: 'sample' as const, id: place.id, place })),
    ...(client ? published.items.map(asset => ({ kind: 'published' as const, id: `asset:${asset.assetId}`, asset })) : []),
  ].filter(row => filter !== 'saved' || saved.includes(row.id));
  const header = <>
    <AppBar brand={<Text style={styles.brand}>roam.</Text>}><StatusPill theme={theme} /></AppBar>
    <PageHeader theme={theme} title="Somewhere slower." description="Places for days with no rush." />
    <View style={styles.toolbar}>
      <Segmented theme={theme} value={filter} onChange={setFilter} options={[{ value: 'explore', label: 'Explore' }, { value: 'saved', label: saved.length ? `Saved ${saved.length}` : 'Saved' }]} />
      <Text style={styles.count}>{rows.length} {rows.length === 1 ? 'place' : 'places'}</Text>
    </View>
  </>;
  const empty = <View style={styles.empty}>
      <Image source={require('../../assets/essential-mark.png')} style={styles.emptyMark} />
      <Text style={styles.emptyTitle}>Nothing saved yet.</Text><Text style={styles.emptyBody}>Save a place from Explore and it will wait for you here.</Text>
      <Pressable accessibilityRole="button" onPress={() => setFilter('explore')} style={styles.textButton}><Text style={styles.textButtonLabel}>Back to Explore</Text><Feather name="arrow-right" size={15} color={theme.ink} /></Pressable>
    </View>;
  const renderRow = ({ item, index }: { item: TravelRow; index: number }) => {
    if (item.kind === 'published') {
      const isSaved = saved.includes(item.id);
      const name = item.asset.name || `Artwork ${index + 1}`;
      return <View style={styles.card}>
        <View style={styles.pictureWrap}>
          {client && viewable.has(item.id)
            ? <AssetlibDynamicImage client={client} asset={item.asset} fallback={placeholder} appearance={APP_APPEARANCE} revision={revision} cachePolicy="memory" style={styles.picture} contentFit="cover" accessibilityLabel={name} />
            : <Image source={placeholder} style={styles.picture} accessibilityLabel="Artwork placeholder" />}
        </View>
        <View style={styles.caption}>
          <View style={styles.captionText}><Text style={styles.location}>From your collection</Text><Text style={styles.placeTitle} numberOfLines={1}>{name}</Text></View>
          <SaveButton saved={isSaved} name={name} onPress={() => toggleSaved(item.id)} />
        </View>
      </View>;
    }
    const place = item.place;
    const isSaved = saved.includes(place.id);
    const open = expanded === place.id;
    return <View style={styles.card}>
      <View style={styles.pictureWrap}><ManagedArtwork asset={place.id === 'cove' ? AppAssets.Travel.coast : AppAssets.Travel.ridge} fallback={place.image} style={styles.picture} contentFit="cover" accessibilityLabel={place.id === 'cove' ? 'Artwork for The quiet coast' : 'Artwork for A path through the pines'} /></View>
      <View style={styles.caption}>
        <View style={styles.captionText}><Text style={styles.location}>{place.location}</Text><Text style={styles.placeTitle}>{place.title}</Text></View>
        <SaveButton saved={isSaved} name={place.title} onPress={() => toggleSaved(place.id)} />
      </View>
      <View style={styles.body}>
        <Text style={styles.placeDescription}>{place.description}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${open ? 'Hide' : 'Show'} a day at ${place.title}`} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setExpanded(open ? null : place.id)} style={styles.planRow}>
          <Text style={styles.planText}>{open ? 'A day, loosely planned' : 'Plan a day'}</Text><Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.ink} />
        </Pressable>
        {open && <View style={styles.itinerary}>{place.itinerary.map((idea, ideaIndex) => <View style={styles.idea} key={idea}><Text style={styles.ideaNumber}>{ideaIndex + 1}</Text><Text style={styles.ideaText}>{idea}</Text></View>)}</View>}
      </View>
    </View>;
  };
  const footer = <>
    {filter === 'explore' && published.loading && <ActivityIndicator accessibilityLabel="Loading more artwork" color={theme.ink} style={styles.loading} />}
    {filter === 'explore' && published.error && <View style={styles.feedFeedback}><Text accessibilityRole="alert" style={styles.feedNote}>{published.error}</Text><Pressable accessibilityRole="button" onPress={published.loadMore} style={styles.textButton}><Text style={styles.textButtonLabel}>Try again</Text></Pressable></View>}
    {filter === 'explore' && !published.loading && !published.error && published.nextCursor && <Pressable accessibilityRole="button" onPress={published.loadMore} style={styles.textButton}><Text style={styles.textButtonLabel}>More from your collection</Text><Feather name="arrow-down" size={15} color={theme.ink} /></Pressable>}
  </>;
  return <FlatList<TravelRow>
    data={rows}
    renderItem={renderRow}
    keyExtractor={item => item.kind === 'published' ? `${item.id}:${item.asset.sequence}` : item.id}
    extraData={{ viewable, saved, expanded, revision }}
    ListHeaderComponent={header}
    ListEmptyComponent={empty}
    ListFooterComponent={footer}
    onViewableItemsChanged={onViewableItemsChanged}
    viewabilityConfig={viewabilityConfig}
    onEndReached={() => { if (filter === 'explore' && !published.error) published.loadMore(); }}
    onEndReachedThreshold={0.5}
    initialNumToRender={2}
    maxToRenderPerBatch={3}
    windowSize={3}
    style={styles.scroll}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  />;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  brand: { fontFamily: type.display, fontSize: 26, letterSpacing: -1, color: theme.ink },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8 }, count: { fontFamily: type.regular, color: theme.muted, fontSize: 12 },
  card: { backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.line, overflow: 'hidden', marginBottom: 18 },
  pictureWrap: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#e4dcc7' }, picture: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: theme.caption },
  captionText: { flex: 1, minWidth: 0 }, location: { fontFamily: type.medium, fontSize: 11, color: theme.accent }, placeTitle: { fontFamily: type.display, fontSize: 20, letterSpacing: -0.4, color: theme.ink, marginTop: 3 },
  save: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' }, saveActive: { backgroundColor: theme.fill, borderColor: theme.fill }, pressed: { opacity: 0.7 },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }, placeDescription: { fontFamily: type.regular, fontSize: 13, lineHeight: 20, color: theme.muted },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginTop: 8, borderTopWidth: 1, borderTopColor: theme.line }, planText: { fontFamily: type.medium, fontSize: 13, color: theme.ink },
  itinerary: { backgroundColor: theme.wash, padding: 14, gap: 10, marginBottom: 10, borderRadius: 12 }, idea: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, ideaNumber: { fontFamily: type.medium, fontSize: 12, color: theme.accent, width: 14, lineHeight: 19 }, ideaText: { fontFamily: type.regular, fontSize: 13, lineHeight: 19, color: theme.ink, flex: 1 },
  empty: { paddingVertical: 44, alignItems: 'center' }, emptyMark: { width: 40, height: 40, marginBottom: 18 }, emptyTitle: { fontFamily: type.display, fontSize: 22, color: theme.ink }, emptyBody: { fontFamily: type.regular, textAlign: 'center', fontSize: 14, color: theme.muted, lineHeight: 22, marginTop: 8 },
  textButton: { minHeight: 44, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, textButtonLabel: { fontFamily: type.medium, fontSize: 14, color: theme.ink },
  loading: { paddingVertical: 24 }, feedFeedback: { paddingBottom: 20 }, feedNote: { fontFamily: type.regular, fontSize: 12, color: theme.muted },
});
