import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, type, useDemo } from '../components/Lab';
import { ManagedArtwork } from '../assetlib/Connection';
import { AppAssets } from '../assets.generated';

const places = [
  { id: 'cove', title: 'The quiet coast', location: 'SEA AIR · SLOW MORNINGS', image: require('../../assets/coast-hero.png'), description: 'A little house above the water. A long breakfast. Nowhere in particular to be.', itinerary: ['A morning walk along the water', 'Lunch in the old harbor', 'One more chapter in the afternoon sun'] },
  { id: 'ridge', title: 'A path through the pines', location: 'GREEN HILLS · FRESH PERSPECTIVE', image: require('../../assets/ridge-card.png'), description: 'Follow the winding path, find a sunny spot, and make a whole afternoon of it.', itinerary: ['A gentle climb through the trees', 'A picnic with a view', 'The long, lovely way back'] },
];

export default function TravelScreen() {
  const { saved, toggleSaved } = useDemo();
  const [filter, setFilter] = useState<'explore' | 'saved'>('explore');
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = filter === 'saved' ? places.filter(place => saved.includes(place.id)) : places;
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.brandRow}><Text style={styles.brand}>roam.</Text><Text style={styles.edition}>WEEKEND NOTES / 01</Text></View>
    <View style={styles.intro}><Text style={styles.eyebrow}>A LITTLE OUT OF THE ORDINARY</Text><Text style={styles.title}>Somewhere{ '\n' }slower.</Text><Text style={styles.description}>Good places for days with no rush.{ '\n' }Keep a few for when you need them.</Text></View>
    <View style={styles.sectionRow}><View style={styles.filters}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === 'explore' }} aria-pressed={filter === 'explore'} onPress={() => setFilter('explore')} style={[styles.filter, filter === 'explore' && styles.selectedFilter]}><Text style={[styles.filterText, filter === 'explore' && styles.selectedFilterText]}>Explore</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === 'saved' }} aria-pressed={filter === 'saved'} onPress={() => setFilter('saved')} style={[styles.filter, filter === 'saved' && styles.selectedFilter]}><Text style={[styles.filterText, filter === 'saved' && styles.selectedFilterText]}>Saved {saved.length}</Text></Pressable>
    </View><Text style={styles.count}>{String(visible.length).padStart(2, '0')} PLACES</Text></View>
    {visible.length === 0 && <View style={styles.empty}>
      <Image source={require('../../assets/essential-mark.png')} style={styles.emptyMark} />
      <Text style={styles.emptyTitle}>A good place to start.</Text><Text style={styles.emptyBody}>Save a place from Explore.{ '\n' }Your weekend ideas will be right here.</Text>
      <Pressable accessibilityRole="button" onPress={() => setFilter('explore')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Find a little escape →</Text></Pressable>
    </View>}
    {visible.map((place, index) => {
      const isSaved = saved.includes(place.id);
      const open = expanded === place.id;
      return <View style={styles.place} key={place.id}>
        <View style={styles.pictureWrap}><ManagedArtwork asset={place.id === 'cove' ? AppAssets.Travel.coast : AppAssets.Travel.ridge} fallback={place.image} style={styles.picture} contentFit="cover" accessibilityLabel={place.id === 'cove' ? 'Artwork for The quiet coast' : 'Artwork for A path through the pines'} />
          <View style={styles.imageLabel}><Text style={styles.imageLabelText}>A CHANGE OF SCENERY</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved ? 'Unsave' : 'Save'} ${place.title}`} accessibilityState={{ selected: isSaved }} aria-pressed={isSaved} onPress={() => toggleSaved(place.id)} style={[styles.save, isSaved && styles.saveActive]}><Text style={[styles.saveIcon, isSaved && styles.saveIconActive]}>{isSaved ? '♥' : '♡'}</Text></Pressable>
        </View>
        <View style={styles.placeMeta}><Text style={styles.location}>{place.location}</Text><Text style={styles.placeNumber}>0{index + 1}</Text></View>
        <Text style={styles.placeTitle}>{place.title}</Text><Text style={styles.placeDescription}>{place.description}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${open ? 'Hide' : 'Show'} ideas for ${place.title}`} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setExpanded(open ? null : place.id)} style={styles.ideasButton}><Text style={styles.ideasText}>{open ? 'A day, loosely planned' : 'Picture a day here'}</Text><Text style={styles.ideasArrow}>{open ? '−' : '↗'}</Text></Pressable>
        {open && <View style={styles.itinerary}>{place.itinerary.map((idea, ideaIndex) => <View style={styles.idea} key={idea}><Text style={styles.ideaNumber}>0{ideaIndex + 1}</Text><Text style={styles.ideaText}>{idea}</Text></View>)}</View>}
      </View>;
    })}
    <View style={styles.endnote}><View style={styles.rule} /><Text style={styles.endnoteText}>LESS PLANNING. MORE WANDERING.</Text><Text style={styles.sampleNote}>Illustrated places, made for this sample.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontFamily: type.display, fontSize: 34, letterSpacing: -1.5, color: colors.ink }, edition: { fontFamily: type.bold, fontSize: 10, letterSpacing: 1, color: '#697060' },
  intro: { paddingTop: 36, paddingBottom: 29 }, eyebrow: { fontFamily: type.bold, fontSize: 10, letterSpacing: 1.5, color: '#856132', marginBottom: 11 }, title: { fontFamily: type.display, fontSize: 54, lineHeight: 57, letterSpacing: -2.4, color: colors.ink }, description: { fontFamily: type.regular, fontSize: 15, lineHeight: 23, color: '#616858', marginTop: 17 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 8 }, filters: { flexDirection: 'row', gap: 6 }, filter: { minHeight: 44, paddingHorizontal: 17, borderRadius: 24, justifyContent: 'center', borderWidth: 1, borderColor: '#d9d9ca' }, selectedFilter: { backgroundColor: '#e2e5d7', borderColor: '#e2e5d7' }, filterText: { fontFamily: type.medium, color: '#606956', fontSize: 13 }, selectedFilterText: { color: '#324731' }, count: { fontFamily: type.medium, color: '#68705d', fontSize: 10, letterSpacing: 1 },
  place: { marginBottom: 32 }, pictureWrap: { width: '100%', aspectRatio: 4 / 3, borderRadius: 9, overflow: 'hidden', backgroundColor: '#e4dcc7' }, picture: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }, imageLabel: { position: 'absolute', bottom: 13, left: 13, backgroundColor: '#f5f1e7', borderRadius: 3, paddingHorizontal: 9, paddingVertical: 7 }, imageLabelText: { fontFamily: type.bold, fontSize: 9, letterSpacing: 0.8, color: colors.ink }, save: { position: 'absolute', right: 12, top: 12, width: 44, height: 44, borderRadius: 24, backgroundColor: '#f5f1e7', alignItems: 'center', justifyContent: 'center' }, saveActive: { backgroundColor: colors.ink }, saveIcon: { fontFamily: type.regular, fontSize: 29, lineHeight: 35, color: colors.ink }, saveIconActive: { color: '#f5f1e7', fontSize: 25 },
  placeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, alignItems: 'center' }, location: { fontFamily: type.bold, fontSize: 9, letterSpacing: 0.8, color: '#7b6240', flexShrink: 1 }, placeNumber: { fontFamily: type.regular, fontSize: 11, color: '#69715f' }, placeTitle: { fontFamily: type.display, fontSize: 28, letterSpacing: -0.8, color: colors.ink, marginTop: 7 }, placeDescription: { fontFamily: type.regular, fontSize: 14, lineHeight: 22, color: '#626959', marginTop: 9 }, ideasButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, borderBottomWidth: 1, borderBottomColor: '#d7d7c9', marginTop: 8 }, ideasText: { fontFamily: type.bold, fontSize: 13, color: colors.ink }, ideasArrow: { fontSize: 22, color: colors.ink }, itinerary: { backgroundColor: '#e9e9db', padding: 16, gap: 15, marginTop: 12, borderRadius: 6 }, idea: { flexDirection: 'row', gap: 14 }, ideaNumber: { fontFamily: type.medium, fontSize: 12, color: '#80724f' }, ideaText: { fontFamily: type.regular, fontSize: 13, lineHeight: 19, color: '#45553f', flex: 1 },
  empty: { paddingVertical: 44, alignItems: 'center' }, emptyMark: { width: 44, height: 44, marginBottom: 22 }, emptyTitle: { fontFamily: type.display, fontSize: 25, color: colors.ink }, emptyBody: { fontFamily: type.regular, textAlign: 'center', fontSize: 14, color: '#626959', lineHeight: 22, marginTop: 10 }, emptyButton: { minHeight: 48, marginTop: 12, justifyContent: 'center' }, emptyButtonText: { fontFamily: type.bold, fontSize: 14, color: colors.ink },
  endnote: { alignItems: 'center', marginTop: 3, gap: 12 }, rule: { width: 32, height: 1, backgroundColor: '#a6a68e' }, endnoteText: { fontFamily: type.bold, fontSize: 9, letterSpacing: 1.3, color: '#69715e' }, sampleNote: { fontFamily: type.regular, fontSize: 12, color: '#6a7162' },
});
