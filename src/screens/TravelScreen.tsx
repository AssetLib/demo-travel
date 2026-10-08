import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { AssetlibDynamicImage } from '@assetlib/sdk-expo';
import type { DynamicAssetRef } from '@assetlib/sdk-core';
import { colors, type, useDemo } from '../components/Lab';
import { ManagedArtwork, useAssetConnection } from '../assetlib/Connection';
import { usePublishedAssets } from '../assetlib/usePublishedAssets';
import { AppAssets } from '../assets.generated';

const places = [
  { id: 'cove', title: 'The quiet coast', location: 'Sea air · slow mornings', image: require('../../assets/coast-hero.png'), description: 'A little house above the water. A long breakfast. Nowhere in particular to be.', itinerary: ['A morning walk along the water', 'Lunch in the old harbor', 'One more chapter in the afternoon sun'] },
  { id: 'ridge', title: 'A path through the pines', location: 'Green hills · fresh perspective', image: require('../../assets/ridge-card.png'), description: 'Follow the winding path, find a sunny spot, and make a whole afternoon of it.', itinerary: ['A gentle climb through the trees', 'A picnic with a view', 'The long, lovely way back'] },
];
type TravelRow = { kind: 'sample'; id: string; place: typeof places[number] } | { kind: 'published'; id: string; asset: DynamicAssetRef };
const placeholder = require('../../assets/destination-placeholder.png');
const viewabilityConfig = { itemVisiblePercentThreshold: 1 };

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
    <View style={styles.brandRow}><Text style={styles.brand}>roam.</Text></View>
    <View style={styles.intro}><Text style={styles.title}>Somewhere{ '\n' }slower.</Text><Text style={styles.description}>Good places for days with no rush.{ '\n' }Keep a few for when you need them.</Text></View>
    <View style={styles.sectionRow}><View style={styles.filters}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === 'explore' }} aria-pressed={filter === 'explore'} onPress={() => setFilter('explore')} style={[styles.filter, filter === 'explore' && styles.selectedFilter]}><Text style={[styles.filterText, filter === 'explore' && styles.selectedFilterText]}>Explore</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === 'saved' }} aria-pressed={filter === 'saved'} onPress={() => setFilter('saved')} style={[styles.filter, filter === 'saved' && styles.selectedFilter]}><Text style={[styles.filterText, filter === 'saved' && styles.selectedFilterText]}>Saved {saved.length}</Text></Pressable>
    </View><Text style={styles.count}>{rows.length} {rows.length === 1 ? 'place' : 'places'}</Text></View>
  </>;
  const empty = <View style={styles.empty}>
      <Image source={require('../../assets/essential-mark.png')} style={styles.emptyMark} />
      <Text style={styles.emptyTitle}>A good place to start.</Text><Text style={styles.emptyBody}>Save a place from Explore.{ '\n' }Your weekend ideas will be right here.</Text>
      <Pressable accessibilityRole="button" onPress={() => setFilter('explore')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Find a little escape →</Text></Pressable>
    </View>;
  const renderRow = ({ item, index }: { item: TravelRow; index: number }) => {
    if (item.kind === 'published') {
      const isSaved = saved.includes(item.id);
      const name = item.asset.name || `Artwork ${index + 1}`;
      return <View style={styles.place}>
        <View style={styles.pictureWrap}>
          {client && viewable.has(item.id)
            ? <AssetlibDynamicImage client={client} asset={item.asset} fallback={placeholder} revision={revision} cachePolicy="memory" style={styles.picture} contentFit="cover" accessibilityLabel={name} />
            : <Image source={placeholder} style={styles.picture} accessibilityLabel="Artwork placeholder" />}
          <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved ? 'Unsave' : 'Save'} ${name}`} accessibilityState={{ selected: isSaved }} aria-pressed={isSaved} onPress={() => toggleSaved(item.id)} style={[styles.save, isSaved && styles.saveActive]}><Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>{isSaved ? '♥' : '♡'}</Text></Pressable>
        </View>
        <View style={styles.placeMeta}><Text style={styles.location}>From your collection</Text></View>
        <Text style={styles.placeTitle}>{name}</Text>
      </View>;
    }
      const place = item.place;
      const isSaved = saved.includes(place.id);
      const open = expanded === place.id;
      return <View style={styles.place}>
        <View style={styles.pictureWrap}><ManagedArtwork asset={place.id === 'cove' ? AppAssets.Travel.coast : AppAssets.Travel.ridge} fallback={place.image} style={styles.picture} contentFit="cover" accessibilityLabel={place.id === 'cove' ? 'Artwork for The quiet coast' : 'Artwork for A path through the pines'} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved ? 'Unsave' : 'Save'} ${place.title}`} accessibilityState={{ selected: isSaved }} aria-pressed={isSaved} onPress={() => toggleSaved(place.id)} style={[styles.save, isSaved && styles.saveActive]}><Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>{isSaved ? '♥' : '♡'}</Text></Pressable>
        </View>
        <View style={styles.placeMeta}><Text style={styles.location}>{place.location}</Text></View>
        <Text style={styles.placeTitle}>{place.title}</Text><Text style={styles.placeDescription}>{place.description}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${open ? 'Hide' : 'Show'} ideas for ${place.title}`} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setExpanded(open ? null : place.id)} style={styles.ideasButton}><Text style={styles.ideasText}>{open ? 'A day, loosely planned' : 'Picture a day here'}</Text><Text style={styles.ideasArrow}>{open ? '−' : '↗'}</Text></Pressable>
        {open && <View style={styles.itinerary}>{place.itinerary.map((idea, ideaIndex) => <View style={styles.idea} key={idea}><Text style={styles.ideaNumber}>0{ideaIndex + 1}</Text><Text style={styles.ideaText}>{idea}</Text></View>)}</View>}
      </View>;
  };
  const footer = <>
    {filter === 'explore' && published.loading && <ActivityIndicator accessibilityLabel="Loading more artwork" color={colors.ink} style={styles.loading} />}
    {filter === 'explore' && published.error && <View style={styles.feedFeedback}><Text accessibilityRole="alert" style={styles.sampleNote}>{published.error}</Text><Pressable accessibilityRole="button" onPress={published.loadMore} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Try again</Text></Pressable></View>}
    {filter === 'explore' && !published.loading && !published.error && published.nextCursor && <Pressable accessibilityRole="button" onPress={published.loadMore} style={styles.emptyButton}><Text style={styles.emptyButtonText}>More from your collection ↓</Text></Pressable>}
    <View style={styles.endnote}><Text style={styles.sampleNote}>Illustrated places, made for this sample.</Text></View>
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
  scroll: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  loading: { paddingVertical: 24 }, feedFeedback: { paddingBottom: 20 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontFamily: type.display, fontSize: 30, letterSpacing: -1.2, color: colors.ink },
  intro: { paddingTop: 28, paddingBottom: 26 }, title: { fontFamily: type.display, fontSize: 54, lineHeight: 57, letterSpacing: -2.4, color: colors.ink }, description: { fontFamily: type.regular, fontSize: 15, lineHeight: 23, color: '#616858', marginTop: 17 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 8 }, filters: { flexDirection: 'row', gap: 6 }, filter: { minHeight: 44, paddingHorizontal: 17, borderRadius: 24, justifyContent: 'center', borderWidth: 1, borderColor: '#d9d9ca' }, selectedFilter: { backgroundColor: '#e2e5d7', borderColor: '#e2e5d7' }, filterText: { fontFamily: type.medium, color: '#606956', fontSize: 13 }, selectedFilterText: { color: '#324731' }, count: { fontFamily: type.regular, color: '#68705d', fontSize: 12 },
  place: { marginBottom: 32 }, pictureWrap: { width: '100%', aspectRatio: 4 / 3, borderRadius: 9, overflow: 'hidden', backgroundColor: '#e4dcc7' }, picture: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }, save: { position: 'absolute', right: 12, top: 12, width: 44, height: 44, borderRadius: 24, backgroundColor: '#f5f1e7', alignItems: 'center', justifyContent: 'center' }, saveActive: { backgroundColor: colors.ink }, saveIcon: { fontFamily: type.regular, fontSize: 29, lineHeight: 35, color: colors.ink }, saveIconActive: { color: '#f5f1e7', fontSize: 25 },
  placeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }, location: { fontFamily: type.medium, fontSize: 12, color: '#7b6240', flexShrink: 1 }, placeTitle: { fontFamily: type.display, fontSize: 26, letterSpacing: -0.7, color: colors.ink, marginTop: 4 }, placeDescription: { fontFamily: type.regular, fontSize: 14, lineHeight: 22, color: '#626959', marginTop: 9 }, ideasButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#d7d7c9', marginTop: 8 }, ideasText: { fontFamily: type.bold, fontSize: 13, color: colors.ink }, ideasArrow: { fontSize: 22, color: colors.ink }, itinerary: { backgroundColor: '#e9e9db', padding: 16, gap: 15, marginTop: 12, borderRadius: 6 }, idea: { flexDirection: 'row', gap: 14 }, ideaNumber: { fontFamily: type.medium, fontSize: 12, color: '#80724f' }, ideaText: { fontFamily: type.regular, fontSize: 13, lineHeight: 19, color: '#45553f', flex: 1 },
  empty: { paddingVertical: 44, alignItems: 'center' }, emptyMark: { width: 44, height: 44, marginBottom: 22 }, emptyTitle: { fontFamily: type.display, fontSize: 25, color: colors.ink }, emptyBody: { fontFamily: type.regular, textAlign: 'center', fontSize: 14, color: '#626959', lineHeight: 22, marginTop: 10 }, emptyButton: { minHeight: 48, marginTop: 12, justifyContent: 'center' }, emptyButtonText: { fontFamily: type.bold, fontSize: 14, color: colors.ink },
  endnote: { alignItems: 'center', marginTop: 3, gap: 12 }, sampleNote: { fontFamily: type.regular, fontSize: 12, color: '#6a7162' },
});
