import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AppBar, PageHeader, Segmented, StatusPill, daylight as theme, type, useDemo } from '../components/Lab';
import { Garden } from '../assetlib/Garden';

type Filter = 'all' | 'open' | 'done';
export default function TasksScreen() {
  const { tasks, toggleTask, addTask } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const done = tasks.filter(task => task.done).length;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const submit = () => {
    if (addTask(draft)) { setDraft(''); setFilter('all'); setMessage('Added to your list.'); }
    else setMessage(tasks.length >= 100 ? 'This sample holds up to 100 tasks.' : 'Write a little task first.');
  };
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <AppBar brand={<Text style={styles.brand}>daylight<Text style={styles.dot}>.</Text></Text>}><StatusPill theme={theme} /></AppBar>
      <PageHeader theme={theme} title={'Make room\nfor the good.'} description={today} />
      <View style={styles.gardenCard}>
        <View style={styles.gardenArt}><Garden done={done} total={tasks.length} style={styles.gardenImage} /></View>
        <View style={styles.caption}>
          <View style={styles.captionText}>
            <Text style={styles.captionLabel}>{tasks.length > 0 && done === tasks.length ? 'Look at you go.' : 'Small steps count.'}</Text>
            <Text style={styles.captionValue} accessibilityLiveRegion="polite">{done} of {tasks.length} done today</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{percent}%</Text></View>
        </View>
        <View style={styles.trackWrap}><View style={styles.track}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View></View>
      </View>
      <View style={styles.listHeading}><Text style={styles.listTitle}>Today’s list</Text><Text style={styles.listCount}>{tasks.length - done} left</Text></View>
      <Segmented theme={theme} value={filter} onChange={value => { setFilter(value); setMessage(''); }} options={[{ value: 'all', label: 'All' }, { value: 'open', label: 'To do' }, { value: 'done', label: 'Done' }]} />
      <View style={styles.taskList}>{visible.map(task => <Pressable key={task.id} accessibilityRole="checkbox" accessibilityLabel={task.title} accessibilityState={{ checked: task.done }} aria-checked={task.done} onPress={() => { toggleTask(task.id); setMessage(''); }} style={({ pressed }) => [styles.task, pressed && styles.taskPressed]}>
        <View style={[styles.checkbox, task.done && styles.checked]}>{task.done && <Feather name="check" size={14} color={theme.onFill} />}</View>
        <View style={styles.taskCopy}><Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text><Text style={styles.taskCategory}>{task.category}</Text></View>
      </Pressable>)}</View>
      {visible.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>{filter === 'done' ? 'Nothing done yet.' : 'All clear.'}</Text><Text style={styles.emptyBody}>{filter === 'done' ? 'Check off a task and it will appear here.' : 'Everything on your list is done. Enjoy it.'}</Text></View>}
      <View style={styles.inputRow}>
        <TextInput accessibilityLabel="New task" placeholder="Add a task" placeholderTextColor={theme.muted} value={draft} onChangeText={value => { setDraft(value); setMessage(''); }} onSubmitEditing={submit} returnKeyType="done" maxLength={100} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={submit} style={({ pressed }) => [styles.addButton, pressed && styles.taskPressed]}><Feather name="plus" size={20} color={theme.onFill} /></Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  brand: { fontFamily: type.bold, fontSize: 24, letterSpacing: -1, color: theme.ink }, dot: { color: theme.accent },
  gardenCard: { backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' },
  gardenArt: { width: '100%', aspectRatio: 3 / 2, backgroundColor: '#e8eee1' }, gardenImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14, paddingHorizontal: 16, backgroundColor: theme.caption },
  captionText: { flex: 1, minWidth: 0 }, captionLabel: { fontFamily: type.medium, fontSize: 11, color: theme.accent }, captionValue: { fontFamily: type.display, fontSize: 20, letterSpacing: -0.4, color: theme.ink, marginTop: 3 },
  badge: { minWidth: 44, height: 32, paddingHorizontal: 10, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, alignItems: 'center', justifyContent: 'center' }, badgeText: { fontFamily: type.medium, fontSize: 12, color: theme.ink },
  trackWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: theme.caption }, track: { height: 4, backgroundColor: '#d3dcc9', borderRadius: 2, overflow: 'hidden' }, progressFill: { height: 4, backgroundColor: theme.fill, borderRadius: 2 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 12, gap: 8 }, listTitle: { fontFamily: type.bold, fontSize: 15, color: theme.ink }, listCount: { fontFamily: type.regular, fontSize: 12, color: theme.muted },
  taskList: { marginTop: 8 }, task: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: 12 }, taskPressed: { opacity: 0.7 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderColor: '#b9c3ad', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: theme.fill, borderColor: theme.fill },
  taskCopy: { flex: 1 }, taskTitle: { fontFamily: type.medium, color: theme.ink, fontSize: 14, lineHeight: 20 }, taskTitleDone: { color: theme.muted, textDecorationLine: 'line-through' }, taskCategory: { fontFamily: type.regular, fontSize: 12, color: theme.muted, marginTop: 3 },
  empty: { paddingVertical: 28, gap: 6 }, emptyTitle: { fontFamily: type.display, fontSize: 20, color: theme.ink }, emptyBody: { fontFamily: type.regular, fontSize: 14, lineHeight: 22, color: theme.muted },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, padding: 5, borderWidth: 1, borderColor: theme.line, borderRadius: 14, backgroundColor: theme.surface },
  input: { flex: 1, minWidth: 0, minHeight: 40, paddingHorizontal: 12, fontFamily: type.regular, color: theme.ink, fontSize: 14 },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.fill, alignItems: 'center', justifyContent: 'center' },
  message: { minHeight: 20, fontFamily: type.regular, color: theme.muted, fontSize: 12, lineHeight: 18, paddingTop: 8 },
});
